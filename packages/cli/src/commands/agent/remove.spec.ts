import { describe, expect, jest, test } from "@jest/globals";
import RemoveAgent from "./remove";

describe("RemoveAgent", () => {
  const getTestCommand = (argv: string[], confirmation = true): { command: RemoveAgent; service: any } => {
    const service: any = {
      agentService: {
        getAgentSession: jest.fn((name: string) => {
          if (name !== "claude") {
            throw new Error(`No agent named ${name}`);
          }
          return {};
        }),
        remove: jest.fn(async () => {}),
      },
      inquirer: { prompt: jest.fn(async () => ({ confirmation })) },
      remoteProceduresClient: { refreshSessions: jest.fn(async () => {}) },
    };
    const command = new RemoveAgent(argv, {} as any);
    (command as any).cliProviderService = service;
    command.log = jest.fn();
    return { command, service };
  };

  test("asks before removing an agent", async () => {
    const { command, service } = getTestCommand(["claude"]);
    await command.run();

    expect(service.inquirer.prompt).toHaveBeenCalledWith([{ name: "confirmation", message: "remove the agent claude?", type: "confirm" }]);
    expect(service.agentService.remove).toHaveBeenCalledWith("claude");
    expect(command.log).toHaveBeenCalledWith("agent claude removed");
    expect(service.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("keeps the agent when not confirmed", async () => {
    const { command, service } = getTestCommand(["claude"], false);
    await command.run();
    expect(service.agentService.remove).not.toHaveBeenCalled();
  });

  test("--force removes without asking", async () => {
    const { command, service } = getTestCommand(["claude", "--force"]);
    await command.run();
    expect(service.inquirer.prompt).not.toHaveBeenCalled();
    expect(service.agentService.remove).toHaveBeenCalledWith("claude");
  });

  test("refuses an unknown agent before asking", async () => {
    const { command, service } = getTestCommand(["codex"]);
    await expect(command.run()).rejects.toThrow("No agent named codex");
    expect(service.inquirer.prompt).not.toHaveBeenCalled();
  });
});
