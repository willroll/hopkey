import { STSClient, AssumeRoleResponse, Credentials, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { HopkeyAwsStsError } from "../../../errors/hopkey-aws-sts-error";
import { HopkeyNotFoundError } from "../../../errors/hopkey-not-found-error";
import { IBehaviouralNotifier } from "../../../interfaces/i-behavioural-notifier";
import { AwsIamRoleChainedSession } from "../../../models/aws/aws-iam-role-chained-session";
import { CredentialsInfo } from "../../../models/credentials-info";
import { Session } from "../../../models/session";
import { AwsCoreService } from "../../aws-core-service";
import { FileService } from "../../file-service";
import { Repository } from "../../repository";
import { AwsIamRoleChainedSessionRequest } from "./aws-iam-role-chained-session-request";
import { AwsIamUserService } from "./aws-iam-user-service";
import { AwsParentSessionFactory } from "./aws-parent-session.factory";
import { AwsSessionService } from "./aws-session-service";
import { SessionType } from "../../../models/session-type";
import { constants } from "../../../models/constants";
import { AwsAgentSettings, agentAssumeRoleParameters, agentRoleSessionName, normalizeAgentSettings } from "../../../models/aws/aws-agent";
import { AgentActivityDetails, AgentActivityEvent, AgentActivityService } from "../../agent-activity-service";
import { AwsProcessCredentials } from "../../../models/aws/aws-process-credential";
import { SessionStatus } from "../../../models/session-status";
import { HopkeyBaseError } from "../../../errors/hopkey-base-error";
import { HopkeyParseError } from "../../../errors/hopkey-parse-error";
import { LogLevel } from "../../log-service";

export class AwsIamRoleChainedService extends AwsSessionService {
  constructor(
    iSessionNotifier: IBehaviouralNotifier,
    repository: Repository,
    awsCoreService: AwsCoreService,
    fileService: FileService,
    private awsIamUserService: AwsIamUserService,
    private parentSessionServiceFactory: AwsParentSessionFactory,
    private agentActivityService?: AgentActivityService
  ) {
    super(iSessionNotifier, repository, awsCoreService, fileService);
  }

  static sessionTokenFromAssumeRoleResponse(assumeRoleResponse: AssumeRoleResponse): { sessionToken: any } {
    return {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: assumeRoleResponse.Credentials.AccessKeyId.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: assumeRoleResponse.Credentials.SecretAccessKey.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: assumeRoleResponse.Credentials.SessionToken.trim(),
      },
    };
  }

  async create(request: AwsIamRoleChainedSessionRequest): Promise<void> {
    const session = new AwsIamRoleChainedSession(
      request.sessionName,
      request.region,
      request.roleArn,
      request.profileId,
      request.parentSessionId,
      request.roleSessionName
    );
    if (request.sessionId) {
      session.sessionId = request.sessionId;
    }

    if (request.awsAccount) {
      session.awsAccount = request.awsAccount;
    }

    if (request.agent) {
      session.agent = this.validateAgent(request.agent, session.sessionId, session.profileId);
      session.roleSessionName = agentRoleSessionName(session.agent.name);
    }

    this.repository.addSession(session);
    this.sessionNotifier?.setSessions(this.repository.getSessions());
    if (session.agent) {
      this.recordAgentActivity(session, session.agent, AgentActivityEvent.created);
    }
  }

  async update(sessionId: string, updateRequest: AwsIamRoleChainedSessionRequest): Promise<void> {
    const session = this.repository.getSessionById(sessionId) as AwsIamRoleChainedSession;
    if (session) {
      const agent = updateRequest.agent ? this.validateAgent(updateRequest.agent, sessionId, updateRequest.profileId) : undefined;
      const previousAgent = session.agent;
      // Agent sessions and regular ones hand out credentials differently: restart an active session that switches
      const restart = session.status === SessionStatus.active && !!agent !== !!previousAgent;
      if (restart) {
        await this.stop(sessionId);
      }
      session.sessionName = updateRequest.sessionName;
      session.region = updateRequest.region;
      session.roleArn = updateRequest.roleArn;
      session.roleSessionName = agent ? agentRoleSessionName(agent.name) : updateRequest.roleSessionName;
      session.parentSessionId = updateRequest.parentSessionId;
      session.profileId = updateRequest.profileId;
      if (agent) {
        session.agent = agent;
      } else {
        delete session.agent;
      }
      this.repository.updateSession(sessionId, session);
      this.sessionNotifier?.setSessions(this.repository.getSessions());
      if (agent || previousAgent) {
        this.recordAgentActivity(session, agent ?? previousAgent, AgentActivityEvent.updated);
      }
      if (restart) {
        await this.start(sessionId);
      }
    }
  }

  /**
   * Checks the agent settings of a session and returns them as they are stored. An agent needs a unique name and a
   * named profile of its own: another session using the profile could write its credentials where the agent reads.
   */
  validateAgent(agent: AwsAgentSettings, sessionId: string, profileId: string): AwsAgentSettings {
    let normalized: AwsAgentSettings;
    try {
      normalized = normalizeAgentSettings(agent);
    } catch (error) {
      throw new HopkeyParseError(this, error.message);
    }
    const otherSessions = this.repository.getSessions().filter((session) => session.sessionId !== sessionId);
    if (otherSessions.find((session) => (session as AwsIamRoleChainedSession).agent?.name === normalized.name)) {
      throw new HopkeyParseError(this, `An agent named ${normalized.name} already exists`);
    }
    if (profileId === this.repository.getDefaultProfileId()) {
      throw new HopkeyParseError(this, "An agent needs a named profile of its own, not the default one");
    }
    const profileSession = otherSessions.find((session) => (session as any).profileId === profileId);
    if (profileSession) {
      throw new HopkeyParseError(this, `An agent needs a named profile of its own: ${profileSession.sessionName} uses this one`);
    }
    return normalized;
  }

  async start(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId) as AwsIamRoleChainedSession;
    if (session.agent) {
      // The profile may have changed since the agent was set up
      this.validateAgent(session.agent, sessionId, session.profileId);
    }
    await super.start(sessionId);
    if (session.agent && session.status === SessionStatus.active) {
      this.recordAgentActivity(session, session.agent, AgentActivityEvent.enabled);
    }
  }

  async stop(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId) as AwsIamRoleChainedSession;
    const wasActive = session.status !== SessionStatus.inactive;
    await super.stop(sessionId);
    if (session.agent && wasActive && session.status === SessionStatus.inactive) {
      this.recordAgentActivity(session, session.agent, AgentActivityEvent.disabled);
    }
  }

  async delete(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId) as AwsIamRoleChainedSession;
    const agentSession = { sessionId, roleArn: session.roleArn };
    const agent = session.agent;
    await super.delete(sessionId);
    if (agent && !this.repository.getSessions().find((s) => s.sessionId === sessionId)) {
      this.recordAgentActivity(agentSession, agent, AgentActivityEvent.removed);
    }
  }

  /**
   * Agents only get credentials while their session is active, and every credential set they get is recorded.
   */
  async generateProcessCredentials(sessionId: string): Promise<AwsProcessCredentials> {
    const session = this.repository.getSessionById(sessionId) as AwsIamRoleChainedSession;
    if (!session.agent) {
      return super.generateProcessCredentials(sessionId);
    }
    const agent = session.agent;
    const requestedBy = this.agentActivityService ? await this.agentActivityService.requestingProcesses() : [];
    if (session.status !== SessionStatus.active) {
      this.recordAgentActivity(session, agent, AgentActivityEvent.refused, { requestedBy });
      const message = `The agent ${agent.name} is disabled: enable it in Hopkey or with "hopkey agent enable ${agent.name}"`;
      throw new HopkeyBaseError(message, this, LogLevel.warn, message);
    }
    let credentials: AwsProcessCredentials;
    try {
      credentials = await super.generateProcessCredentials(sessionId);
    } catch (error) {
      this.recordAgentActivity(session, agent, AgentActivityEvent.failed, { requestedBy, message: error.message });
      throw error;
    }
    // Throws when the activity file can't be written, so that no credentials go out unrecorded
    this.recordAgentActivity(session, agent, AgentActivityEvent.credentials, {
      requestedBy,
      durationSeconds: agent.durationSeconds,
      expiration: (credentials as any).Expiration,
    });
    return credentials;
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamRoleChainedSession).profileId);
    const credentialObject = {};
    credentialObject[profileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.region,
    };
    return await this.fileService.iniWriteSync(this.awsCoreService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsIamRoleChainedSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile);
  }

  generateCredentialsProxy(sessionId: string): Promise<CredentialsInfo> {
    return this.generateCredentials(sessionId);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // Retrieve Session
    const session = this.repository.getSessionById(sessionId);

    // Retrieve Parent Session
    let parentSession: Session;
    try {
      parentSession = this.repository.getSessionById((session as AwsIamRoleChainedSession).parentSessionId);
    } catch (err) {
      throw new HopkeyNotFoundError(this, `Parent Account Session  not found for Chained Account ${session.sessionName}`);
    }

    // Generate a credential set from Parent Session
    const parentSessionService = this.parentSessionServiceFactory.getSessionService(parentSession.type);
    const parentCredentialsInfo = await parentSessionService.generateCredentialsProxy(parentSession.sessionId);

    const parentCredentials = {
      ["sessionToken"]: parentCredentialsInfo.sessionToken.aws_session_token,
      ["accessKeyId"]: parentCredentialsInfo.sessionToken.aws_access_key_id,
      ["secretAccessKey"]: parentCredentialsInfo.sessionToken.aws_secret_access_key,
    };

    // Assume Role from parent
    // Prepare session credentials set parameters and client
    const sts = new STSClient(this.awsCoreService.stsOptions(session, true, parentCredentials));

    // Configure IamRoleChained Account session parameters
    const roleSessionName = (session as AwsIamRoleChainedSession).roleSessionName;
    const agent = (session as AwsIamRoleChainedSession).agent;
    const params = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleSessionName: roleSessionName ? roleSessionName : constants.roleSessionName,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleArn: (session as AwsIamRoleChainedSession).roleArn,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      DurationSeconds: constants.samlRoleSessionDuration,
      // An agent session is named after the agent, lasts less and is narrowed by its session policy
      ...(agent ? agentAssumeRoleParameters(agent, (session as AwsIamRoleChainedSession).roleArn) : {}),
    };

    // Generate Session token
    return this.generateSessionToken(session, sts, params);
  }

  validateCredentials(sessionId: string): Promise<boolean> {
    return new Promise((resolve, _) => {
      this.generateCredentials(sessionId)
        .then((__) => {
          resolve(true);
        })
        .catch((__) => {
          resolve(false);
        });
    });
  }

  removeSecrets(_: string): void {}

  async getCloneRequest(session: AwsIamRoleChainedSession): Promise<AwsIamRoleChainedSessionRequest> {
    return {
      profileId: session.profileId,
      region: session.region,
      sessionName: session.sessionName,
      roleArn: session.roleArn,
      parentSessionId: session.parentSessionId,
      roleSessionName: session.roleSessionName,
    };
  }

  async getAccountNumberFromCallerIdentity(session: AwsIamRoleChainedSession): Promise<string> {
    if (session.type === SessionType.awsIamRoleChained) {
      return `${session.roleArn.split("/")[0].substring(13, 25)}`;
    } else {
      throw new Error("AWS IAM Role Chained Session required");
    }
  }

  // Agents never get their credentials written to the credentials file
  protected usesCredentialProcess(sessionId: string): boolean {
    return !!(this.repository.getSessionById(sessionId) as AwsIamRoleChainedSession).agent || super.usesCredentialProcess(sessionId);
  }

  private recordAgentActivity(
    agentSession: { sessionId: string; roleArn: string },
    agent: AwsAgentSettings,
    event: AgentActivityEvent,
    details: AgentActivityDetails = {}
  ): void {
    try {
      if (!this.agentActivityService) {
        throw new Error("no activity history is set up");
      }
      this.agentActivityService.record(agentSession, agent, event, details);
    } catch (error) {
      const message = `Hopkey could not record the activity of the agent ${agent.name}: ${error.message}`;
      // Credentials don't go out unrecorded; other events are only reported
      if (event === AgentActivityEvent.credentials) {
        throw new HopkeyBaseError(message, this, LogLevel.error, message);
      }
      console.warn(message);
    }
  }

  private async generateSessionToken(session, sts, params): Promise<CredentialsInfo> {
    try {
      // Assume Role
      const assumeRoleCommand = new AssumeRoleCommand(params);
      const assumeRoleResponse = await sts.send(assumeRoleCommand);

      // Save session token expiration
      this.saveSessionTokenExpirationInTheSession(session, assumeRoleResponse.Credentials);

      // Generate correct object from session token response and return
      return AwsIamRoleChainedService.sessionTokenFromAssumeRoleResponse(assumeRoleResponse);
    } catch (err) {
      throw new HopkeyAwsStsError(this, err.message);
    }
  }

  private saveSessionTokenExpirationInTheSession(session: Session, credentials: Credentials): void {
    const sessions = this.repository.getSessions();
    const index = sessions.indexOf(session);
    const currentSession: Session = sessions[index];

    if (credentials !== undefined) {
      currentSession.sessionTokenExpiration = credentials.Expiration.toISOString();
    }

    sessions[index] = currentSession;

    this.repository.updateSessions(sessions);
    this.sessionNotifier?.setSessions([...sessions]);
  }
}
