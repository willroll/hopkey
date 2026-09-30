import { describe, expect, jest, test } from "@jest/globals";
import EnableAgent from "./enable";
import DisableAgent from "./disable";

describe("EnableAgent and DisableAgent", () => {
  const cliProviderService = (): any => ({
    agentService: {
      enable: jest.fn(async () => {}),
      disable: jest.fn(async () => {}),
      getAgentSession: jest.fn(() => ({ profileId: "profileId", agent: { durationSeconds: 1800 } })),
    },
    namedProfilesService: { getProfileName: jest.fn(() => "agent-claude") },
    remoteProceduresClient: { refreshSessions: jest.fn(async () => {}) },
  });

  test("enable", async () => {
    const service = cliProviderService();
    const command = new EnableAgent(["claude"], {} as any);
    (command as any).cliProviderService = service;
    command.log = jest.fn();
    await command.run();

    expect(service.agentService.enable).toHaveBeenCalledWith("claude");
    expect(command.log).toHaveBeenCalledWith("agent claude enabled: it gets credentials with AWS_PROFILE=agent-claude");
    expect(service.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("enable - reports errors and still refreshes the app", async () => {
    const service = cliProviderService();
    service.agentService.enable.mockImplementation(async () => {
      throw new Error("No agent named claude");
    });
    const command = new EnableAgent(["claude"], {} as any);
    (command as any).cliProviderService = service;
    await expect(command.run()).rejects.toThrow("No agent named claude");
    expect(service.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("enable - needs the agent name", async () => {
    const command = new EnableAgent([], {} as any);
    (command as any).cliProviderService = cliProviderService();
    await expect(command.run()).rejects.toThrow();
  });

  test("disable", async () => {
    const service = cliProviderService();
    const command = new DisableAgent(["claude"], {} as any);
    (command as any).cliProviderService = service;
    command.log = jest.fn();
    await command.run();

    expect(service.agentService.disable).toHaveBeenCalledWith("claude");
    expect(command.log).toHaveBeenCalledWith("agent claude disabled: credentials it already got work for up to 30 more minutes");
    expect(service.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });
});
