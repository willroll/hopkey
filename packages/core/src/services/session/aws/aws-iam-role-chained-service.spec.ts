import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { AwsIamRoleChainedSession } from "../../../models/aws/aws-iam-role-chained-session";
import { AwsIamRoleChainedService } from "./aws-iam-role-chained-service";
import { SessionType } from "../../../models/session-type";
import { HopkeyNotFoundError } from "../../../errors/hopkey-not-found-error";
import { HopkeyAwsStsError } from "../../../errors/hopkey-aws-sts-error";
import { constants } from "../../../models/constants";
import { AwsIamRoleChainedSessionRequest } from "./aws-iam-role-chained-session-request";
import { AssumeRoleCommand } from "@aws-sdk/client-sts";
import { AgentPermissions } from "../../../models/aws/aws-agent";
import { SessionStatus } from "../../../models/session-status";
import { AgentActivityEvent } from "../../agent-activity-service";

describe("AwsIamRoleChainedService", () => {
  let sessionNotifier;
  let repository;
  let fileService;
  let awsCoreService;
  let session;
  let parentSession;
  let credentialFile;
  let generateSessionToken;
  let parentSessionServiceFactory;
  let parentSessionService;

  beforeEach(() => {
    session = {
      sessionId: "session1",
      type: SessionType.awsIamRoleChained,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
      region: "eu-west-1",
      profileId: "profileId",
      roleSessionName: "miao",
      parentSessionId: "sessionP",
      sessionName: "piao",
    } as any;
    parentSession = {
      sessionId: "sessionP",
      type: SessionType.awsIamRoleFederated,
      roleArn: "federated/12345",
      region: "eu-west-1",
      profileId: "profileIdP",
    } as any;
    credentialFile = {
      profile1: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: "",
        region: session.region,
      },
    } as any;
    sessionNotifier = {
      addSession: jest.fn(() => {}),
      setSessions: jest.fn(() => {}),
    };
    repository = {
      addSession: jest.fn(() => {}),
      getSessions: jest.fn(() => [session]),
      getSessionById: jest.fn((sessionId: string) => (sessionId === session.sessionId ? session : parentSession)),
      getProfileName: jest.fn(() => "profile1"),
      updateSessions: jest.fn(() => {}),
      workspace: {
        samlRoleSessionDuration: constants.samlRoleSessionDuration,
      },
    };
    fileService = {
      iniWriteSync: jest.fn((_: string, __: any) => {}),
      iniParseSync: jest.fn((_: string) => credentialFile),
      replaceWriteSync: jest.fn((_: string, __: any) => {}),
    };
    awsCoreService = {
      awsCredentialPath: jest.fn(() => "aws-path"),
      stsOptions: jest.fn(() => {}),
    };
    parentSessionService = {
      generateCredentials: jest.fn((_: string) => ({
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: "",
        },
      })),
      generateCredentialsProxy: jest.fn((_: string) => ({
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: "",
        },
      })),
    };
    parentSessionServiceFactory = {
      getSessionService: jest.fn(() => parentSessionService),
    };

    generateSessionToken = jest.fn((_: string, __: string, _2: string) => {});
  });

  test("getCloneRequest", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    const result = await awsIamRoleChainedService.getCloneRequest(session);
    const mock = {
      parentSessionId: "sessionP",
      sessionName: "piao",
      profileId: "profileId",
      region: "eu-west-1",
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
      roleSessionName: "miao",
    };
    expect(result).toStrictEqual(mock);
  });

  test("create - add a new role chained session", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, null, null, null);
    await awsIamRoleChainedService.create(session);

    expect(sessionNotifier.setSessions).toHaveBeenCalled();
    expect(repository.addSession).toHaveBeenCalled();
  });

  test("update", async () => {
    const updateRequest = {
      sessionName: "a",
      region: "b",
      roleArn: "c",
      roleSessionName: "d",
      parentSessionId: "1",
      profileId: "2",
    } as AwsIamRoleChainedSessionRequest;
    const mockedSession = {};
    repository = {
      getSessions: jest.fn(() => [mockedSession]),
      getSessionById: jest.fn(() => mockedSession),
      updateSession: jest.fn(),
    } as any;
    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, null, null, null);
    await awsIamRoleChainedService.update("session1", updateRequest);
    expect(repository.getSessionById).toHaveBeenCalledWith("session1");
    expect(repository.updateSession).toHaveBeenCalledWith("session1", updateRequest);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([mockedSession]);
  });

  test("applyCredentials - apply a credential set by writing on the ini file", async () => {
    const credentialsInfo = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "access",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "secret",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: "123456token",
      },
    } as any;

    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, fileService, null, null);
    await awsIamRoleChainedService.applyCredentials(session.sessionId, credentialsInfo);

    expect(repository.getSessionById).toHaveBeenCalledWith("session1");
    expect(repository.getProfileName).toHaveBeenCalledWith("profileId");
    expect(fileService.iniWriteSync).toHaveBeenCalledWith("aws-path", {
      profile1: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: credentialsInfo.sessionToken.aws_session_token,
        region: session.region,
      },
    });
  });

  test("deApplyCredentials - remove data from the credentials file", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, fileService, null, null);
    await awsIamRoleChainedService.deApplyCredentials(session.sessionId);

    expect(repository.getSessionById).toHaveBeenCalledWith("session1");
    expect(repository.getProfileName).toHaveBeenCalledWith("profileId");
    expect(fileService.iniParseSync).toHaveBeenCalledWith("aws-path");
    expect(fileService.replaceWriteSync).toHaveBeenCalledWith("aws-path", {});
  });

  test("generateCredentialsProxy", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    jest.spyOn(awsIamRoleChainedService, "generateCredentials").mockImplementation(jest.fn());
    await awsIamRoleChainedService.generateCredentialsProxy("fake-session-id");
    expect(awsIamRoleChainedService.generateCredentials).toHaveBeenCalledWith("fake-session-id");
  });

  test("generateCredentials - generate a credential set", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(
      sessionNotifier,
      repository,
      awsCoreService,
      fileService,
      null,
      parentSessionServiceFactory
    );
    (awsIamRoleChainedService as any).generateSessionToken = generateSessionToken;

    await awsIamRoleChainedService.generateCredentials(session.sessionId);

    expect(repository.getSessionById).toHaveBeenCalledWith("session1");
    expect(repository.getSessionById).toHaveBeenCalledWith("sessionP");

    expect(generateSessionToken).toHaveBeenCalled();
  });

  test("generateCredentials - RoleSessionName undefined", async () => {
    const session2 = { sessionId: "fake-session-id", roleArn: "arn" };
    const repository2 = {
      getSessionById: () => session2,
      workspace: {
        samlRoleSessionDuration: constants.samlRoleSessionDuration,
      },
    } as any;
    const awsIamRoleChainedService = new AwsIamRoleChainedService(
      sessionNotifier,
      repository2,
      awsCoreService,
      fileService,
      null,
      parentSessionServiceFactory
    );
    (awsIamRoleChainedService as any).generateSessionToken = jest.fn();
    await awsIamRoleChainedService.generateCredentials("fake-session-id");
    expect((awsIamRoleChainedService as any).generateSessionToken.mock.calls[0][2]).toEqual({
      ["RoleSessionName"]: constants.roleSessionName,
      ["RoleArn"]: session2.roleArn,
      ["DurationSeconds"]: constants.samlRoleSessionDuration,
    });
  });

  test("generateCredentials - throws an error", async () => {
    const sessionId = "fake-session-id";
    const session2 = { sessionName: "fake-session-name", parentSessionId: "throw-exeption" };
    const repository2 = {
      getSessionById: jest.fn((_sessionId) => {
        if (_sessionId === "throw-exeption") {
          throw new Error("Error");
        } else {
          return session2;
        }
      }),
    } as any;
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, repository2, null, null, null, null);
    try {
      await awsIamRoleChainedService.generateCredentials(sessionId);
    } catch (err) {
      expect(err).toEqual(new HopkeyNotFoundError(this, `Parent Account Session  not found for Chained Account ${session2.sessionName}`));
    }
  });

  test("validateCredentials", async () => {
    const session2 = {
      sessionId: "1",
      type: SessionType.awsIamRoleChained,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
    } as any;
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    jest.spyOn(awsIamRoleChainedService, "generateCredentials").mockImplementation(() => Promise.resolve({} as any));
    let result = await awsIamRoleChainedService.validateCredentials(session2.sessionId);
    expect(result).toBeTruthy();

    jest.spyOn(awsIamRoleChainedService, "generateCredentials").mockImplementation(() => Promise.reject({} as any));
    result = await awsIamRoleChainedService.validateCredentials(session2.sessionId);
    expect(result).not.toBeTruthy();
  });

  test("removeSecret - exists", () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, null, null, null);
    expect(awsIamRoleChainedService.removeSecrets).not.toBe(undefined);
  });

  test("getAccountNumberFromCallerIdentity", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    const accountNumber = await awsIamRoleChainedService.getAccountNumberFromCallerIdentity(session);

    expect(accountNumber).toBe("nopqrstuvwxy");
  });

  test("getAccountNumberFromCallerIdentity - error", async () => {
    session = {};
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);

    await expect(() => awsIamRoleChainedService.getAccountNumberFromCallerIdentity(session as AwsIamRoleChainedSession)).rejects.toThrow(
      new Error("AWS IAM Role Chained Session required")
    );
  });

  test("generateSessionToken - create a session token given the credential information we need", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(
      sessionNotifier,
      repository,
      awsCoreService,
      fileService,
      null,
      parentSessionServiceFactory
    );
    (awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession = jest.fn();
    const stsMock = {
      send: jest.fn(() => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Credentials: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          AccessKeyId: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          SecretAccessKey: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          SessionToken: "",
        },
      })),
    };

    await (awsIamRoleChainedService as any).generateSessionToken(session, stsMock, {});

    expect((awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession).toHaveBeenCalled();
    expect(JSON.stringify(stsMock.send.mock.calls[0])).toBe(JSON.stringify([new AssumeRoleCommand({} as any)]));
  });

  test("generateSessionToken - throws error", async () => {
    const sts = {
      assumeRole: () => {
        throw new Error({ message: "Error" } as any);
      },
    };
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    try {
      await (awsIamRoleChainedService as any).generateSessionToken("fake-session", sts, "fake-params");
    } catch (err) {
      expect(err).toStrictEqual(new HopkeyAwsStsError(this, err.message));
    }
  });

  test("saveSessionTokenExpirationInTheSession - save a new token expiration in a specified session, with and without credentials", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(
      sessionNotifier,
      repository,
      awsCoreService,
      fileService,
      null,
      parentSessionServiceFactory
    );

    await (awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession(session, undefined);
    expect(session.sessionTokenExpiration).toBe(undefined);

    await (awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession(session, { ["Expiration"]: new Date() });

    expect(session.sessionTokenExpiration).not.toBe(undefined);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(repository.updateSessions).toHaveBeenCalledWith([session]);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([session]);

    jest.spyOn(awsIamRoleChainedService as any, "removeSecrets");
    awsIamRoleChainedService.removeSecrets("");
    expect(awsIamRoleChainedService.removeSecrets).toHaveBeenCalled();
  });
});

describe("AwsIamRoleChainedService - agents", () => {
  const agent = { name: "claude", permissions: AgentPermissions.readOnly, durationSeconds: 900, setSourceIdentity: false };
  const roleArn = "arn:aws:iam::123456789012:role/agents";
  let sessions: any[];
  let workspace: any;
  let repository: any;
  let fileService: any;
  let awsCoreService: any;
  let agentActivityService: any;
  let parentSessionService: any;
  let service: AwsIamRoleChainedService;

  const agentSession = (): any => sessions.find((session) => session.sessionId === "agent1");
  const recordedEvents = (): string[] => agentActivityService.record.mock.calls.map((call) => call[2]);

  beforeEach(() => {
    sessions = [
      { sessionId: "parent", sessionName: "me", type: SessionType.awsSsoRole, status: SessionStatus.inactive, profileId: "defaultProfile" },
      {
        sessionId: "agent1",
        sessionName: "claude",
        type: SessionType.awsIamRoleChained,
        status: SessionStatus.inactive,
        roleArn,
        region: "eu-west-1",
        profileId: "agentProfile",
        parentSessionId: "parent",
        roleSessionName: "agent-claude",
        agent: { ...agent },
      },
    ];
    workspace = { credentialMethod: constants.credentialFile, sessions };
    repository = {
      getWorkspace: jest.fn(() => workspace),
      getSessions: jest.fn(() => sessions),
      getSessionById: jest.fn((sessionId: string) => {
        const found = sessions.find((session) => session.sessionId === sessionId);
        if (!found) {
          throw new Error(`session with id ${sessionId} not found.`);
        }
        return found;
      }),
      addSession: jest.fn((session: any) => sessions.push(session)),
      updateSession: jest.fn(),
      updateSessions: jest.fn(),
      deleteSession: jest.fn((sessionId: string) =>
        sessions.splice(
          sessions.findIndex((session) => session.sessionId === sessionId),
          1
        )
      ),
      getDefaultProfileId: jest.fn(() => "defaultProfile"),
      getProfileName: jest.fn((profileId: string) => (profileId === "defaultProfile" ? "default" : "agent-claude")),
      listPending: jest.fn(() => sessions.filter((session) => session.status === SessionStatus.pending)),
      listActive: jest.fn(() => sessions.filter((session) => session.status === SessionStatus.active)),
      listIamRoleChained: jest.fn(() => []),
    };
    fileService = {
      existsSync: jest.fn(() => true),
      writeFileSyncWithOptions: jest.fn(),
      iniWriteSync: jest.fn(async () => {}),
      iniParseSync: jest.fn(async () => ({ ["profile agent-claude"]: {} })),
      replaceWriteSync: jest.fn(async () => {}),
    };
    awsCoreService = {
      awsConfigPath: jest.fn(() => "config-path"),
      awsCredentialPath: jest.fn(() => "credentials-path"),
      stsOptions: jest.fn(() => ({})),
    };
    agentActivityService = { record: jest.fn(), requestingProcesses: jest.fn(async () => ["aws", "claude"]) };
    parentSessionService = {
      generateCredentialsProxy: jest.fn(async () => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        sessionToken: { aws_access_key_id: "parent-key", aws_secret_access_key: "parent-secret", aws_session_token: "parent-token" },
      })),
    };
    service = new AwsIamRoleChainedService(
      null,
      repository,
      awsCoreService,
      fileService,
      null,
      { getSessionService: () => parentSessionService } as any,
      agentActivityService
    );
    (service as any).generateSessionToken = jest.fn(async (session: any) => {
      session.sessionTokenExpiration = "2026-09-30T10:15:00.000Z";
      // eslint-disable-next-line @typescript-eslint/naming-convention
      return { sessionToken: { aws_access_key_id: "agent-key", aws_secret_access_key: "agent-secret", aws_session_token: "agent-token" } };
    });
  });

  test("generateCredentials scopes the role session to the agent", async () => {
    await service.generateCredentials("agent1");
    expect((service as any).generateSessionToken.mock.calls[0][2]).toEqual({
      ["RoleSessionName"]: "agent-claude",
      ["RoleArn"]: roleArn,
      ["DurationSeconds"]: 900,
      ["PolicyArns"]: [{ arn: "arn:aws:iam::aws:policy/ReadOnlyAccess" }],
    });
  });

  test("start - hands out an agent's credentials through credential_process even in credential file mode", async () => {
    await service.start("agent1");

    expect(fileService.iniWriteSync).toHaveBeenCalledWith("config-path", {
      ["profile agent-claude"]: { ["credential_process"]: "hopkey session generate agent1", region: "eu-west-1" },
    });
    expect((service as any).generateSessionToken).not.toHaveBeenCalled();
    expect(agentSession().status).toBe(SessionStatus.active);
    expect(recordedEvents()).toEqual([AgentActivityEvent.enabled]);
  });

  test("start - refuses an agent on the default named profile", async () => {
    agentSession().profileId = "defaultProfile";
    await expect(service.start("agent1")).rejects.toThrow("An agent needs a named profile of its own, not the default one");
    expect(fileService.iniWriteSync).not.toHaveBeenCalled();
    expect(recordedEvents()).toEqual([]);
  });

  test("stop - removes the agent's credential_process and records it", async () => {
    agentSession().status = SessionStatus.active;
    await service.stop("agent1");

    expect(fileService.replaceWriteSync).toHaveBeenCalledWith("config-path", {});
    expect(agentSession().status).toBe(SessionStatus.inactive);
    expect(recordedEvents()).toEqual([AgentActivityEvent.disabled]);
  });

  test("generateProcessCredentials - refuses a disabled agent", async () => {
    await expect(service.generateProcessCredentials("agent1")).rejects.toThrow(
      'The agent claude is disabled: enable it in Hopkey or with "hopkey agent enable claude"'
    );
    expect(parentSessionService.generateCredentialsProxy).not.toHaveBeenCalled();
    expect(agentActivityService.record).toHaveBeenCalledWith(agentSession(), agentSession().agent, AgentActivityEvent.refused, {
      requestedBy: ["aws", "claude"],
    });
  });

  test("generateProcessCredentials - hands out the credentials of an enabled agent and records it", async () => {
    agentSession().status = SessionStatus.active;
    const credentials = await service.generateProcessCredentials("agent1");

    expect(JSON.parse(JSON.stringify(credentials))).toEqual({
      ["Version"]: 1,
      ["AccessKeyId"]: "agent-key",
      ["SecretAccessKey"]: "agent-secret",
      ["SessionToken"]: "agent-token",
      ["Expiration"]: "2026-09-30T10:15:00.000Z",
    });
    expect(agentActivityService.record).toHaveBeenCalledWith(agentSession(), agentSession().agent, AgentActivityEvent.credentials, {
      requestedBy: ["aws", "claude"],
      durationSeconds: 900,
      expiration: "2026-09-30T10:15:00.000Z",
    });
  });

  test("generateProcessCredentials - no credentials go out when the activity can't be recorded", async () => {
    agentSession().status = SessionStatus.active;
    agentActivityService.record.mockImplementation(() => {
      throw new Error("disk full");
    });
    await expect(service.generateProcessCredentials("agent1")).rejects.toThrow("Hopkey could not record the activity of the agent claude: disk full");
  });

  test("generateProcessCredentials - no credentials go out without an activity history", async () => {
    agentSession().status = SessionStatus.active;
    const serviceWithoutHistory = new AwsIamRoleChainedService(null, repository, awsCoreService, fileService, null, {
      getSessionService: () => parentSessionService,
    } as any);
    (serviceWithoutHistory as any).generateSessionToken = (service as any).generateSessionToken;
    await expect(serviceWithoutHistory.generateProcessCredentials("agent1")).rejects.toThrow(
      "Hopkey could not record the activity of the agent claude: no activity history is set up"
    );
  });

  test("generateProcessCredentials - records a failure to get credentials", async () => {
    agentSession().status = SessionStatus.active;
    (service as any).generateSessionToken.mockImplementation(async () => {
      throw new Error("not authorized to perform: sts:SetSourceIdentity");
    });
    await expect(service.generateProcessCredentials("agent1")).rejects.toThrow("sts:SetSourceIdentity");
    expect(agentActivityService.record).toHaveBeenCalledWith(agentSession(), agentSession().agent, AgentActivityEvent.failed, {
      requestedBy: ["aws", "claude"],
      message: "not authorized to perform: sts:SetSourceIdentity",
    });
  });

  test("generateProcessCredentials - a regular session is not recorded", async () => {
    delete agentSession().agent;
    agentSession().status = SessionStatus.active;
    await service.generateProcessCredentials("agent1");
    expect(agentActivityService.record).not.toHaveBeenCalled();
    expect(agentActivityService.requestingProcesses).not.toHaveBeenCalled();
  });

  test("create - an agent gets a unique name and a named profile of its own", async () => {
    const request = { sessionName: "codex", region: "eu-west-1", roleArn, parentSessionId: "parent" };
    await expect(service.create({ ...request, profileId: "codexProfile", agent: { ...agent } })).rejects.toThrow(
      "An agent named claude already exists"
    );
    await expect(service.create({ ...request, profileId: "defaultProfile", agent: { ...agent, name: "codex" } })).rejects.toThrow(
      "not the default one"
    );
    await expect(service.create({ ...request, profileId: "agentProfile", agent: { ...agent, name: "codex" } })).rejects.toThrow(
      "claude uses this one"
    );
    await expect(service.create({ ...request, profileId: "codexProfile", agent: { ...agent, name: "codex", durationSeconds: 60 } })).rejects.toThrow(
      "between 15 and 60 minutes"
    );
    expect(repository.addSession).not.toHaveBeenCalled();

    await service.create({ ...request, profileId: "codexProfile", roleSessionName: "ignored", agent: { ...agent, name: "codex" } });
    const created = repository.addSession.mock.calls[0][0];
    expect(created.agent).toEqual({ name: "codex", permissions: AgentPermissions.readOnly, durationSeconds: 900, setSourceIdentity: false });
    expect(created.roleSessionName).toBe("agent-codex");
    expect(recordedEvents()).toEqual([AgentActivityEvent.created]);
  });

  test("update - an active session that becomes an agent restarts with credential_process", async () => {
    delete agentSession().agent;
    agentSession().status = SessionStatus.active;
    await service.update("agent1", {
      sessionName: "claude",
      region: "eu-west-1",
      roleArn,
      parentSessionId: "parent",
      profileId: "agentProfile",
      agent: { ...agent },
    });

    // Stopped as a regular session, from the credentials file, then started as an agent
    expect(fileService.replaceWriteSync).toHaveBeenCalledWith("credentials-path", expect.anything());
    expect(fileService.iniWriteSync).toHaveBeenCalledWith("config-path", expect.anything());
    expect(agentSession().agent).toEqual(agent);
    expect(agentSession().roleSessionName).toBe("agent-claude");
    expect(agentSession().status).toBe(SessionStatus.active);
    expect(recordedEvents()).toEqual([AgentActivityEvent.updated, AgentActivityEvent.enabled]);
  });

  test("update - removing the agent settings of an inactive session doesn't restart it", async () => {
    await service.update("agent1", {
      sessionName: "claude",
      region: "eu-west-1",
      roleArn,
      roleSessionName: "assumed-by-me",
      parentSessionId: "parent",
      profileId: "agentProfile",
    });
    expect(agentSession().agent).toBeUndefined();
    expect(agentSession().roleSessionName).toBe("assumed-by-me");
    expect(fileService.iniWriteSync).not.toHaveBeenCalled();
    expect(recordedEvents()).toEqual([AgentActivityEvent.updated]);
  });

  test("delete - records the removal of an agent", async () => {
    await service.delete("agent1");
    expect(sessions.find((session) => session.sessionId === "agent1")).toBeUndefined();
    expect(agentActivityService.record).toHaveBeenCalledWith({ sessionId: "agent1", roleArn }, agent, AgentActivityEvent.removed, {});
  });
});
