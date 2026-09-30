import { describe, expect, jest, test } from "@jest/globals";
import { ux } from "@oclif/core";
import AgentHistory from "./history";

describe("AgentHistory", () => {
  const activities = [
    {
      time: "2026-09-30T10:00:00.000Z",
      event: "credentials",
      agent: "claude",
      sessionId: "agent1",
      roleArn: "arn:aws:iam::123456789012:role/agents",
      permissions: "read-only",
      requestedBy: ["aws", "bash", "claude"],
      expiration: "2026-09-30T10:15:00.000Z",
    },
    {
      time: "2026-09-30T09:00:00.000Z",
      event: "failed",
      agent: "claude",
      sessionId: "agent1",
      roleArn: "arn:aws:iam::123456789012:role/agents",
      permissions: "something-new",
      message: "AccessDenied",
    },
  ];

  test("run - shows the history of an agent", async () => {
    const service: any = { agentService: { history: jest.fn(() => activities) } };
    const command = new AgentHistory(["claude", "--limit", "10", "--no-truncate"], {} as any);
    (command as any).cliProviderService = service;
    const tableSpy = jest.spyOn(ux, "table").mockImplementation(() => null);

    await command.run();

    expect(service.agentService.history).toHaveBeenCalledWith("claude", 10);
    expect(tableSpy.mock.calls[0][0]).toEqual([
      {
        time: "2026-09-30T10:00:00.000Z",
        agent: "claude",
        event: "credentials",
        role: "arn:aws:iam::123456789012:role/agents",
        permissions: "Read-only",
        requestedBy: "aws < bash < claude",
        expiration: "2026-09-30T10:15:00.000Z",
        message: "",
      },
      {
        time: "2026-09-30T09:00:00.000Z",
        agent: "claude",
        event: "failed",
        role: "arn:aws:iam::123456789012:role/agents",
        permissions: "something-new",
        requestedBy: "",
        expiration: "",
        message: "AccessDenied",
      },
    ]);
    expect(tableSpy.mock.calls[0][2]).toEqual(expect.objectContaining({ ["no-truncate"]: true }));
    expect(tableSpy.mock.calls[0][2]).not.toHaveProperty("limit");
    tableSpy.mockRestore();
  });

  test("run - every agent, 50 events by default", async () => {
    const service: any = { agentService: { history: jest.fn(() => []) } };
    const command = new AgentHistory([], {} as any);
    (command as any).cliProviderService = service;
    const tableSpy = jest.spyOn(ux, "table").mockImplementation(() => null);

    await command.run();

    expect(service.agentService.history).toHaveBeenCalledWith(undefined, 50);
    tableSpy.mockRestore();
  });

  test("run - reports errors", async () => {
    const service: any = {
      agentService: {
        history: jest.fn(() => {
          throw new Error("EACCES");
        }),
      },
    };
    const command = new AgentHistory([], {} as any);
    (command as any).cliProviderService = service;
    await expect(command.run()).rejects.toThrow("EACCES");
  });
});
