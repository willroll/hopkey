import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { AgentActivityEvent, AgentActivityService } from "./agent-activity-service";
import { AgentPermissions, agentConstants } from "../models/aws/aws-agent";

describe("AgentActivityService", () => {
  let homeDir: string;
  let nativeService: any;
  let service: AgentActivityService;
  const agentSession = { sessionId: "session1", roleArn: "arn:aws:iam::123456789012:role/agents" };
  const agent = { name: "claude", permissions: AgentPermissions.readOnly, durationSeconds: 900, setSourceIdentity: false };

  beforeEach(() => {
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hopkey-agent-activity-"));
    nativeService = { fs, path, os: { homedir: () => homeDir }, process: { ppid: 0, platform: "linux" }, exec: jest.fn() };
    service = new AgentActivityService(nativeService);
  });

  afterEach(() => {
    fs.rmSync(homeDir, { recursive: true, force: true });
  });

  test("record appends an event to a file only the user can read", () => {
    const activity = service.record(agentSession, agent, AgentActivityEvent.credentials, {
      requestedBy: ["aws", "bash", "claude"],
      expiration: "2026-09-30T10:00:00.000Z",
      durationSeconds: 900,
    });

    expect(activity).toEqual({
      time: expect.any(String),
      event: AgentActivityEvent.credentials,
      agent: "claude",
      sessionId: "session1",
      roleArn: agentSession.roleArn,
      permissions: AgentPermissions.readOnly,
      requestedBy: ["aws", "bash", "claude"],
      expiration: "2026-09-30T10:00:00.000Z",
      durationSeconds: 900,
    });
    const filePath = path.join(homeDir, agentConstants.activityFileDestination);
    expect(fs.readFileSync(filePath, "utf8")).toBe(`${JSON.stringify(activity)}\n`);
    expect(fs.statSync(filePath).mode.toString(8).slice(-3)).toBe("600");
  });

  test("list returns the newest events first, filtered by agent and limited", () => {
    service.record(agentSession, agent, AgentActivityEvent.enabled);
    service.record({ sessionId: "session2", roleArn: "arn2" }, { ...agent, name: "codex" }, AgentActivityEvent.enabled);
    service.record(agentSession, agent, AgentActivityEvent.credentials);

    expect(service.list().map((activity) => [activity.agent, activity.event])).toEqual([
      ["claude", AgentActivityEvent.credentials],
      ["codex", AgentActivityEvent.enabled],
      ["claude", AgentActivityEvent.enabled],
    ]);
    expect(service.list("claude").map((activity) => activity.event)).toEqual([AgentActivityEvent.credentials, AgentActivityEvent.enabled]);
    expect(service.list(undefined, 1).map((activity) => activity.agent)).toEqual(["claude"]);
    expect(service.lastActivity("codex").event).toBe(AgentActivityEvent.enabled);
    expect(service.lastActivity("nobody")).toBeUndefined();
  });

  test("list is empty without a file and skips a line cut short", () => {
    expect(service.list()).toEqual([]);
    service.record(agentSession, agent, AgentActivityEvent.enabled);
    fs.appendFileSync(path.join(homeDir, agentConstants.activityFileDestination), '{"time":"2026-');
    expect(service.list().length).toBe(1);
  });

  test("record rotates a full file and list reads both files", () => {
    service.record(agentSession, agent, AgentActivityEvent.enabled);
    const filePath = path.join(homeDir, agentConstants.activityFileDestination);
    fs.appendFileSync(filePath, " ".repeat(agentConstants.maxActivityFileSize));
    service.record(agentSession, agent, AgentActivityEvent.disabled);

    expect(fs.existsSync(path.join(homeDir, agentConstants.previousActivityFileDestination))).toBe(true);
    expect(fs.statSync(filePath).size).toBeLessThan(1000);
    expect(service.list().map((activity) => activity.event)).toEqual([AgentActivityEvent.disabled, AgentActivityEvent.enabled]);
  });

  test("record throws when the file can't be written", () => {
    fs.writeFileSync(path.join(homeDir, ".hopkey"), "a file where the directory should be");
    expect(() => service.record(agentSession, agent, AgentActivityEvent.credentials)).toThrow();
  });

  test("requestingProcesses walks the parent processes on Linux", async () => {
    const stats = {
      ["/proc/100/stat"]: "100 (aws) S 90 100 100 0 -1",
      ["/proc/90/stat"]: "90 (my shell (x)) S 80 90 90 0 -1",
      ["/proc/80/stat"]: "80 (claude) S 1 80 80 0 -1",
    };
    nativeService.fs = { readFileSync: jest.fn((file: string) => stats[file] ?? fs.readFileSync(file, "utf8")) };
    nativeService.process = { ppid: 100, platform: "linux" };

    expect(await service.requestingProcesses()).toEqual(["aws", "my shell (x)", "claude"]);
    expect(await service.requestingProcesses(1)).toEqual(["aws"]);
  });

  test("requestingProcesses stops at a process it can't read", async () => {
    nativeService.fs = {
      readFileSync: jest.fn((file: string) => {
        if (file === "/proc/100/stat") {
          return "100 (aws) S 90 100 100 0 -1";
        }
        throw new Error("ENOENT");
      }),
    };
    nativeService.process = { ppid: 100, platform: "linux" };
    expect(await service.requestingProcesses()).toEqual(["aws"]);
  });

  test("requestingProcesses uses ps on macOS and gives up elsewhere", async () => {
    const psOutput = { ["100"]: "   90 /usr/local/bin/aws\n", ["90"]: "    1 /bin/zsh\n" };
    nativeService.exec = jest.fn((command: string, _options: any, callback: any) => callback(null, psOutput[command.split(" ").pop()] ?? ""));
    nativeService.process = { ppid: 100, platform: "darwin" };
    expect(await service.requestingProcesses()).toEqual(["aws", "zsh"]);
    expect(nativeService.exec).toHaveBeenCalledWith("ps -o ppid=,comm= -p 100", { timeout: 2000 }, expect.any(Function));

    nativeService.process = { ppid: 100, platform: "win32" };
    expect(await service.requestingProcesses()).toEqual([]);
  });
});
