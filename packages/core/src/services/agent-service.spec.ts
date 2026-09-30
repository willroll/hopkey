import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AgentService } from "./agent-service";
import { NamedProfilesService } from "./named-profiles-service";
import { SessionType } from "../models/session-type";
import { SessionStatus } from "../models/session-status";
import { AgentPermissions } from "../models/aws/aws-agent";
import { AgentActivityEvent } from "./agent-activity-service";

describe("AgentService", () => {
  const roleArn = "arn:aws:iam::123456789012:role/agents";
  let sessions: any[];
  let profiles: any[];
  let repository: any;
  let awsIamRoleChainedService: any;
  let agentActivityService: any;
  let service: AgentService;

  beforeEach(() => {
    profiles = [
      { id: "defaultProfile", name: "default" },
      { id: "agentProfile", name: "agent-claude" },
    ];
    sessions = [
      { sessionId: "sso", sessionName: "me via SSO", type: SessionType.awsSsoRole, status: SessionStatus.active, profileId: "defaultProfile" },
      { sessionId: "azure", sessionName: "azure", type: SessionType.azure, status: SessionStatus.inactive },
      {
        sessionId: "agent1",
        sessionName: "claude",
        type: SessionType.awsIamRoleChained,
        status: SessionStatus.active,
        roleArn,
        profileId: "agentProfile",
        parentSessionId: "sso",
        agent: { name: "claude", permissions: AgentPermissions.viewOnly, durationSeconds: 1800, setSourceIdentity: true },
      },
      {
        sessionId: "chained",
        sessionName: "a regular chained session",
        type: SessionType.awsIamRoleChained,
        status: SessionStatus.inactive,
        roleArn,
        profileId: "defaultProfile",
        parentSessionId: "sso",
      },
    ];
    repository = {
      getSessions: jest.fn(() => sessions),
      getSessionById: jest.fn((sessionId: string) => {
        const found = sessions.find((session) => session.sessionId === sessionId);
        if (!found) {
          throw new Error("not found");
        }
        return found;
      }),
      getProfiles: jest.fn(() => profiles),
      getProfileName: jest.fn((profileId: string) => profiles.find((profile) => profile.id === profileId).name),
      addProfile: jest.fn((profile: any) => profiles.push(profile)),
      getDefaultRegion: jest.fn(() => "eu-west-1"),
    };
    awsIamRoleChainedService = {
      validateAgent: jest.fn(),
      create: jest.fn(async (request: any) => sessions.push({ ...request, type: SessionType.awsIamRoleChained, status: SessionStatus.inactive })),
      start: jest.fn(async () => {}),
      stop: jest.fn(async () => {}),
      delete: jest.fn(async () => {}),
    };
    agentActivityService = {
      list: jest.fn(() => [
        { time: "2026-09-30T10:00:00.000Z", event: AgentActivityEvent.credentials, agent: "claude", sessionId: "agent1" },
        { time: "2026-09-30T09:00:00.000Z", event: AgentActivityEvent.enabled, agent: "claude", sessionId: "agent1" },
      ]),
    };
    const namedProfilesService = new NamedProfilesService(null, repository, null);
    service = new AgentService(repository, namedProfilesService, awsIamRoleChainedService, agentActivityService);
  });

  test("getAgentSessions and getAgentSession", () => {
    expect(service.getAgentSessions().map((session) => session.sessionId)).toEqual(["agent1"]);
    expect(service.getAgentSession("claude").sessionId).toBe("agent1");
    expect(() => service.getAgentSession("codex")).toThrow("No agent named codex");
  });

  test("getParentSessions lists the sessions an agent can assume its role from", () => {
    expect(service.getParentSessions()).toEqual([{ sessionId: "sso", sessionName: "me via SSO", type: SessionType.awsSsoRole }]);
  });

  test("listAgents summarizes each agent with its last activity", () => {
    expect(service.listAgents()).toEqual([
      {
        sessionId: "agent1",
        name: "claude",
        enabled: true,
        profileName: "agent-claude",
        roleArn,
        parentSessionName: "me via SSO",
        permissions: AgentPermissions.viewOnly,
        durationSeconds: 1800,
        setSourceIdentity: true,
        lastActivity: expect.objectContaining({ event: AgentActivityEvent.credentials }),
      },
    ]);
  });

  test("listAgents survives a deleted parent session", () => {
    sessions[2].parentSessionId = "gone";
    expect(service.listAgents()[0].parentSessionName).toBe("");
  });

  test("createAgent creates the agent-<name> named profile and the agent session", async () => {
    const session = await service.createAgent({ name: "codex", parentSessionId: "sso", roleArn: ` ${roleArn} ` });

    const profile = profiles.find((namedProfile) => namedProfile.name === "agent-codex");
    expect(profile).toBeDefined();
    expect(awsIamRoleChainedService.validateAgent).toHaveBeenCalledWith(
      { name: "codex", permissions: AgentPermissions.readOnly, sessionPolicy: undefined, durationSeconds: 900, setSourceIdentity: false },
      session.sessionId,
      session.sessionId
    );
    expect(awsIamRoleChainedService.create).toHaveBeenCalledWith({
      sessionId: session.sessionId,
      sessionName: "codex",
      region: "eu-west-1",
      roleArn,
      profileId: profile.id,
      parentSessionId: "sso",
      agent: { name: "codex", permissions: AgentPermissions.readOnly, sessionPolicy: undefined, durationSeconds: 900, setSourceIdentity: false },
    });
  });

  test("createAgent reuses an existing named profile and passes the settings", async () => {
    profiles.push({ id: "sharedProfile", name: "codex-profile" });
    await service.createAgent({
      name: "codex",
      parentSessionId: "sso",
      roleArn,
      region: "us-east-1",
      profileName: "codex-profile",
      sessionName: "Codex",
      permissions: AgentPermissions.custom,
      sessionPolicy: "{}",
      durationSeconds: 3600,
      setSourceIdentity: true,
    });
    expect(repository.addProfile).not.toHaveBeenCalled();
    expect(awsIamRoleChainedService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionName: "Codex",
        region: "us-east-1",
        profileId: "sharedProfile",
        agent: { name: "codex", permissions: AgentPermissions.custom, sessionPolicy: "{}", durationSeconds: 3600, setSourceIdentity: true },
      })
    );
  });

  test("createAgent leaves nothing behind when refused", async () => {
    await expect(service.createAgent({ name: "codex", parentSessionId: "azure", roleArn })).rejects.toThrow(
      "An agent assumes its role from an AWS IAM User, IAM Role Federated or IAM Identity Center session"
    );
    await expect(service.createAgent({ name: "codex", parentSessionId: "chained", roleArn })).rejects.toThrow("An agent assumes its role");
    await expect(service.createAgent({ name: "codex", parentSessionId: "sso", roleArn: " " })).rejects.toThrow("needs the ARN of the role");
    awsIamRoleChainedService.validateAgent.mockImplementation(() => {
      throw new Error("An agent named codex already exists");
    });
    await expect(service.createAgent({ name: "codex", parentSessionId: "sso", roleArn })).rejects.toThrow("already exists");

    expect(repository.addProfile).not.toHaveBeenCalled();
    expect(awsIamRoleChainedService.create).not.toHaveBeenCalled();
  });

  test("enable, disable and remove act on the agent's session", async () => {
    await service.enable("claude");
    expect(awsIamRoleChainedService.start).not.toHaveBeenCalled();
    sessions[2].status = SessionStatus.inactive;
    await service.enable("claude");
    expect(awsIamRoleChainedService.start).toHaveBeenCalledWith("agent1");

    await service.disable("claude");
    expect(awsIamRoleChainedService.stop).toHaveBeenCalledWith("agent1");

    await service.remove("claude");
    expect(awsIamRoleChainedService.delete).toHaveBeenCalledWith("agent1");

    await expect(service.enable("codex")).rejects.toThrow("No agent named codex");
  });

  test("history reads the activity file", () => {
    service.history("claude", 5);
    expect(agentActivityService.list).toHaveBeenCalledWith("claude", 5);
  });

  test("recordUpdate records a change to a session that is or was an agent", () => {
    agentActivityService.record = jest.fn();
    service.recordUpdate(sessions[2]);
    expect(agentActivityService.record).toHaveBeenCalledWith(sessions[2], sessions[2].agent, AgentActivityEvent.updated);

    const previousAgent = { ...sessions[2].agent };
    service.recordUpdate(sessions[3], previousAgent);
    expect(agentActivityService.record).toHaveBeenLastCalledWith(sessions[3], previousAgent, AgentActivityEvent.updated);

    agentActivityService.record.mockClear();
    service.recordUpdate(sessions[3]);
    expect(agentActivityService.record).not.toHaveBeenCalled();
  });
});
