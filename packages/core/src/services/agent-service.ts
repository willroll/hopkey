import * as uuid from "uuid";
import { Repository } from "./repository";
import { NamedProfilesService } from "./named-profiles-service";
import { AwsIamRoleChainedService } from "./session/aws/aws-iam-role-chained-service";
import { AgentActivity, AgentActivityEvent, AgentActivityService } from "./agent-activity-service";
import { AwsIamRoleChainedSession } from "../models/aws/aws-iam-role-chained-session";
import { AgentPermissions, AwsAgentSettings, agentConstants } from "../models/aws/aws-agent";
import { SessionType } from "../models/session-type";
import { SessionStatus } from "../models/session-status";
import { HopkeyNotFoundError } from "../errors/hopkey-not-found-error";
import { HopkeyParseError } from "../errors/hopkey-parse-error";

export interface AgentSummary {
  sessionId: string;
  name: string;
  enabled: boolean;
  profileName: string;
  roleArn: string;
  parentSessionName: string;
  permissions: AgentPermissions;
  durationSeconds: number;
  setSourceIdentity: boolean;
  lastActivity?: AgentActivity;
}

export interface CreateAgentRequest {
  name: string;
  parentSessionId: string;
  roleArn: string;
  region?: string;
  // Defaults to agent-<name>, created when missing
  profileName?: string;
  sessionName?: string;
  permissions?: AgentPermissions;
  sessionPolicy?: string;
  durationSeconds?: number;
  setSourceIdentity?: boolean;
}

// The sessions an agent session can assume its role from
const parentSessionTypes = [SessionType.awsIamUser, SessionType.awsIamRoleFederated, SessionType.awsSsoRole];

/**
 * Manages AI agents, which are IAM Role Chained sessions with agent settings: see AwsAgentSettings.
 */
export class AgentService {
  constructor(
    private repository: Repository,
    private namedProfilesService: NamedProfilesService,
    private awsIamRoleChainedService: AwsIamRoleChainedService,
    private agentActivityService: AgentActivityService
  ) {}

  getAgentSessions(): AwsIamRoleChainedSession[] {
    return this.repository
      .getSessions()
      .filter(
        (session) => session.type === SessionType.awsIamRoleChained && (session as AwsIamRoleChainedSession).agent
      ) as AwsIamRoleChainedSession[];
  }

  getAgentSession(name: string): AwsIamRoleChainedSession {
    const session = this.getAgentSessions().find((agentSession) => agentSession.agent.name === name);
    if (!session) {
      throw new HopkeyNotFoundError(this, `No agent named ${name}`);
    }
    return session;
  }

  getParentSessions(): { sessionId: string; sessionName: string; type: SessionType }[] {
    return this.repository
      .getSessions()
      .filter((session) => parentSessionTypes.includes(session.type))
      .map((session) => ({ sessionId: session.sessionId, sessionName: session.sessionName, type: session.type }));
  }

  listAgents(): AgentSummary[] {
    const activities = this.agentActivityService.list();
    return this.getAgentSessions().map((session) => {
      let parentSessionName = "";
      try {
        parentSessionName = this.repository.getSessionById(session.parentSessionId).sessionName;
      } catch (_) {
        // The parent session was deleted: the agent can't get credentials until it gets another one
      }
      return {
        sessionId: session.sessionId,
        name: session.agent.name,
        enabled: session.status === SessionStatus.active,
        profileName: this.repository.getProfileName(session.profileId),
        roleArn: session.roleArn,
        parentSessionName,
        permissions: session.agent.permissions,
        durationSeconds: session.agent.durationSeconds,
        setSourceIdentity: session.agent.setSourceIdentity,
        lastActivity: activities.find((activity) => activity.sessionId === session.sessionId),
      };
    });
  }

  async createAgent(request: CreateAgentRequest): Promise<AwsIamRoleChainedSession> {
    const parentSession = this.repository.getSessions().find((session) => session.sessionId === request.parentSessionId);
    if (!parentSession || !parentSessionTypes.includes(parentSession.type)) {
      throw new HopkeyParseError(this, "An agent assumes its role from an AWS IAM User, IAM Role Federated or IAM Identity Center session");
    }
    if (!request.roleArn?.trim()) {
      throw new HopkeyParseError(this, "An agent needs the ARN of the role it assumes");
    }
    const agent: AwsAgentSettings = {
      name: request.name,
      permissions: request.permissions ?? agentConstants.defaultPermissions,
      sessionPolicy: request.sessionPolicy,
      durationSeconds: request.durationSeconds ?? agentConstants.defaultDurationSeconds,
      setSourceIdentity: !!request.setSourceIdentity,
    };
    const sessionId = uuid.v4();
    const profileName = (request.profileName || `${agentConstants.roleSessionNamePrefix}${request.name}`).trim();
    const existingProfile = this.namedProfilesService.getNamedProfiles().find((profile) => profile.name === profileName);
    // Check everything before creating the named profile, so that a refused agent leaves nothing behind. A profile that
    // doesn't exist yet is neither the default one nor shared: the new session id stands in for its id.
    this.awsIamRoleChainedService.validateAgent(agent, sessionId, existingProfile?.id ?? sessionId);
    const profileId = existingProfile ? existingProfile.id : this.namedProfilesService.createNamedProfile(profileName).id;

    await this.awsIamRoleChainedService.create({
      sessionId,
      sessionName: request.sessionName || request.name,
      region: request.region || this.repository.getDefaultRegion(),
      roleArn: request.roleArn.trim(),
      profileId,
      parentSessionId: parentSession.sessionId,
      agent,
    });
    return this.repository.getSessionById(sessionId) as AwsIamRoleChainedSession;
  }

  async enable(name: string): Promise<void> {
    const session = this.getAgentSession(name);
    if (session.status !== SessionStatus.active) {
      await this.awsIamRoleChainedService.start(session.sessionId);
    }
  }

  async disable(name: string): Promise<void> {
    await this.awsIamRoleChainedService.stop(this.getAgentSession(name).sessionId);
  }

  async remove(name: string): Promise<void> {
    await this.awsIamRoleChainedService.delete(this.getAgentSession(name).sessionId);
  }

  history(name?: string, limit?: number): AgentActivity[] {
    return this.agentActivityService.list(name, limit);
  }

  /**
   * Records a change to an agent session made without AwsIamRoleChainedService.update, as the session edit dialog does.
   */
  recordUpdate(session: AwsIamRoleChainedSession, previousAgent?: AwsAgentSettings): void {
    const agent = session.agent ?? previousAgent;
    if (agent) {
      this.agentActivityService.record(session, agent, AgentActivityEvent.updated);
    }
  }
}
