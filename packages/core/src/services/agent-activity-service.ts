import { INativeService } from "../interfaces/i-native-service";
import { AwsAgentSettings, agentConstants } from "../models/aws/aws-agent";

export enum AgentActivityEvent {
  // Credentials handed out to a program
  credentials = "credentials",
  // Credentials asked for while the agent was disabled
  refused = "refused",
  // Credentials asked for, but AWS or the parent session failed to issue them
  failed = "failed",
  enabled = "enabled",
  disabled = "disabled",
  created = "created",
  updated = "updated",
  removed = "removed",
}

export interface AgentActivity {
  time: string;
  event: AgentActivityEvent;
  agent: string;
  sessionId: string;
  roleArn: string;
  permissions: string;
  durationSeconds?: number;
  expiration?: string;
  // Names of the programs that asked for credentials, closest first
  requestedBy?: string[];
  message?: string;
}

export interface AgentActivityDetails {
  durationSeconds?: number;
  expiration?: string;
  requestedBy?: string[];
  message?: string;
}

/**
 * Keeps the history of what agents did with their credentials in an append-only JSON Lines file in the Hopkey
 * directory, readable only by the user. It is shared by the desktop app and the CLI, which hands out the credentials.
 */
export class AgentActivityService {
  constructor(private nativeService: INativeService) {}

  get activityFilePath(): string {
    return this.nativeService.path.join(this.nativeService.os.homedir(), agentConstants.activityFileDestination);
  }

  get previousActivityFilePath(): string {
    return this.nativeService.path.join(this.nativeService.os.homedir(), agentConstants.previousActivityFileDestination);
  }

  /**
   * Appends an event to the activity file. It throws when the event can't be written.
   */
  record(
    agentSession: { sessionId: string; roleArn: string },
    agent: AwsAgentSettings,
    event: AgentActivityEvent,
    details: AgentActivityDetails = {}
  ): AgentActivity {
    const activity: AgentActivity = {
      time: new Date().toISOString(),
      event,
      agent: agent.name,
      sessionId: agentSession.sessionId,
      roleArn: agentSession.roleArn,
      permissions: agent.permissions,
      ...details,
    };
    const fs = this.nativeService.fs;
    fs.mkdirSync(this.nativeService.path.dirname(this.activityFilePath), { recursive: true });
    this.rotateIfNeeded();
    fs.appendFileSync(this.activityFilePath, `${JSON.stringify(activity)}\n`, { mode: 0o600 });
    return activity;
  }

  /**
   * Returns the recorded events, newest first.
   */
  list(agentName?: string, limit?: number): AgentActivity[] {
    const activities = [...this.readActivities(this.previousActivityFilePath), ...this.readActivities(this.activityFilePath)]
      .filter((activity) => !agentName || activity.agent === agentName)
      .reverse();
    return limit ? activities.slice(0, limit) : activities;
  }

  lastActivity(agentName: string): AgentActivity | undefined {
    return this.list(agentName, 1)[0];
  }

  /**
   * Names the programs above this process, closest first: when the AWS CLI or an SDK runs credential_process, the
   * first one is that tool and the next ones are what started it, such as a shell and the agent. Only executable
   * names are kept, since command lines can carry secrets.
   */
  async requestingProcesses(depth: number = 4): Promise<string[]> {
    const names: string[] = [];
    let pid = this.nativeService.process?.ppid;
    for (let i = 0; i < depth && pid > 1; i++) {
      const info = await this.processInfo(pid);
      if (!info) {
        break;
      }
      names.push(info.name);
      pid = info.parentPid;
    }
    return names;
  }

  private rotateIfNeeded(): void {
    const fs = this.nativeService.fs;
    if (fs.existsSync(this.activityFilePath) && fs.statSync(this.activityFilePath).size > agentConstants.maxActivityFileSize) {
      fs.renameSync(this.activityFilePath, this.previousActivityFilePath);
    }
  }

  private readActivities(filePath: string): AgentActivity[] {
    const fs = this.nativeService.fs;
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const activities: AgentActivity[] = [];
    for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
      if (line.trim()) {
        try {
          activities.push(JSON.parse(line));
        } catch (_) {
          // Skip a line cut short by a crash
        }
      }
    }
    return activities;
  }

  private async processInfo(pid: number): Promise<{ name: string; parentPid: number } | undefined> {
    const platform = this.nativeService.process?.platform;
    if (platform === "linux") {
      try {
        // "pid (name) state ppid ...", where the name can hold spaces and parentheses
        const stat: string = this.nativeService.fs.readFileSync(`/proc/${pid}/stat`, "utf8");
        const nameEnd = stat.lastIndexOf(")");
        return {
          name: stat.slice(stat.indexOf("(") + 1, nameEnd),
          parentPid: parseInt(stat.slice(nameEnd + 2).split(" ")[1], 10),
        };
      } catch (_) {
        return undefined;
      }
    }
    if (platform === "darwin") {
      return new Promise((resolve) => {
        this.nativeService.exec(`ps -o ppid=,comm= -p ${Number(pid)}`, { timeout: 2000 }, (error: any, stdout: string) => {
          const match = !error && /^\s*(\d+)\s+(.+?)\s*$/.exec(stdout || "");
          resolve(match ? { name: this.nativeService.path.basename(match[2]), parentPid: parseInt(match[1], 10) } : undefined);
        });
      });
    }
    return undefined;
  }
}
