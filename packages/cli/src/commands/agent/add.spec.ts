import { describe, expect, jest, test } from "@jest/globals";
import AddAgent from "./add";
import { AgentPermissions } from "@hopkey/core/models/aws/aws-agent";

describe("AddAgent", () => {
  const roleArn = "arn:aws:iam::123456789012:role/agents";
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): AddAgent => {
    const command = new AddAgent(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  const mockProviderService = (): any => ({
    agentService: {
      getParentSessions: jest.fn(() => [{ sessionId: "sso", sessionName: "me via SSO" }]),
      createAgent: jest.fn(async (request: any) => ({ profileId: "profileId", agent: { name: request.name } })),
    },
    namedProfilesService: { getProfileName: jest.fn(() => "agent-claude") },
    remoteProceduresClient: { refreshSessions: jest.fn(async () => {}) },
    cliNativeService: { fs: { readFileSync: jest.fn(() => '{"Statement": []}') } },
    inquirer: { prompt: jest.fn() },
  });

  test("run - with flags", async () => {
    const service = mockProviderService();
    const command = getTestCommand(service, [
      "--name",
      "claude",
      "--parentSessionId",
      "sso",
      "--roleArn",
      roleArn,
      "--permissions",
      "custom",
      "--policyFile",
      "policy.json",
      "--duration",
      "30",
      "--sourceIdentity",
    ]);
    command.log = jest.fn();
    await command.run();

    expect(service.cliNativeService.fs.readFileSync).toHaveBeenCalledWith("policy.json", "utf8");
    expect(service.agentService.createAgent).toHaveBeenCalledWith({
      name: "claude",
      parentSessionId: "sso",
      roleArn,
      region: undefined,
      profileName: undefined,
      permissions: AgentPermissions.custom,
      sessionPolicy: '{"Statement": []}',
      durationSeconds: 1800,
      setSourceIdentity: true,
    });
    expect(command.log).toHaveBeenCalledWith("agent claude added with the named profile agent-claude");
    expect(command.log).toHaveBeenCalledWith('enable it with "hopkey agent enable claude", then give the agent AWS_PROFILE=agent-claude');
    expect(service.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("run - refuses incomplete flags", async () => {
    let command = getTestCommand(mockProviderService(), ["--name", "claude"]);
    await expect(command.run()).rejects.toThrow("--name, --parentSessionId and --roleArn are required");

    command = getTestCommand(mockProviderService(), [
      "--name",
      "claude",
      "--parentSessionId",
      "sso",
      "--roleArn",
      roleArn,
      "--permissions",
      "custom",
    ]);
    await expect(command.run()).rejects.toThrow("--policyFile goes with --permissions custom");

    command = getTestCommand(mockProviderService(), ["--name", "claude", "--parentSessionId", "sso", "--roleArn", roleArn, "--duration", "90"]);
    await expect(command.run()).rejects.toThrow();
  });

  test("run - interactive", async () => {
    const service = mockProviderService();
    service.inquirer.prompt.mockImplementation(async (questions: any[]) => {
      expect(questions.map((question) => question.name)).toEqual([
        "name",
        "parentSessionId",
        "roleArn",
        "permissions",
        "policyFile",
        "duration",
        "sourceIdentity",
      ]);
      expect(questions[0].validate("bad name")).toContain("Agent names");
      expect(questions[0].validate("claude")).toBe(true);
      expect(questions[1].choices).toEqual([{ name: "me via SSO", value: "sso" }]);
      expect(questions[4].when({ permissions: AgentPermissions.readOnly })).toBe(false);
      return {
        name: "claude",
        parentSessionId: "sso",
        roleArn,
        permissions: AgentPermissions.viewOnly,
        duration: 15,
        sourceIdentity: false,
      };
    });
    const command = getTestCommand(service);
    command.log = jest.fn();
    await command.run();

    expect(service.agentService.createAgent).toHaveBeenCalledWith({
      name: "claude",
      parentSessionId: "sso",
      roleArn,
      permissions: AgentPermissions.viewOnly,
      sessionPolicy: undefined,
      durationSeconds: 900,
      setSourceIdentity: false,
    });
  });

  test("run - interactive needs a session to assume the role from", async () => {
    const service = mockProviderService();
    service.agentService.getParentSessions.mockImplementation(() => []);
    await expect(getTestCommand(service).run()).rejects.toThrow("add one first");
  });

  test("run - reports a refused agent and still refreshes the app", async () => {
    const service = mockProviderService();
    service.agentService.createAgent.mockImplementation(async () => {
      throw new Error("An agent named claude already exists");
    });
    const command = getTestCommand(service, ["--name", "claude", "--parentSessionId", "sso", "--roleArn", roleArn]);
    await expect(command.run()).rejects.toThrow("An agent named claude already exists");
    expect(service.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });
});
