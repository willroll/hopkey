import { describe, expect, jest, test } from "@jest/globals";
import { ux } from "@oclif/core";
import ListAgents from "./list";
import { AgentPermissions } from "@hopkey/core/models/aws/aws-agent";

describe("ListAgents", () => {
  const getTestCommand = (cliProviderService: any = null): ListAgents => {
    const command = new ListAgents([], {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("run - reports errors", async () => {
    const command = getTestCommand();
    command.showAgents = jest.fn(async () => {
      throw new Error("error");
    });
    await expect(command.run()).rejects.toThrow("error");
  });

  test("showAgents", async () => {
    const agents = [
      {
        sessionId: "agent1",
        name: "claude",
        enabled: true,
        profileName: "agent-claude",
        roleArn: "arn:aws:iam::123456789012:role/agents",
        parentSessionName: "me via SSO",
        permissions: AgentPermissions.readOnly,
        durationSeconds: 900,
        setSourceIdentity: true,
        lastActivity: { time: "2026-09-30T10:00:00.000Z", event: "credentials" },
      },
      {
        sessionId: "agent2",
        name: "codex",
        enabled: false,
        profileName: "agent-codex",
        roleArn: "arn:aws:iam::123456789012:role/agents",
        parentSessionName: "",
        permissions: AgentPermissions.custom,
        durationSeconds: 3600,
        setSourceIdentity: false,
      },
    ];
    const command = getTestCommand({ agentService: { listAgents: () => agents } });
    const tableSpy = jest.spyOn(ux, "table").mockImplementation(() => null);

    await command.showAgents();

    expect(tableSpy.mock.calls[0][0]).toEqual([
      {
        id: "agent1",
        name: "claude",
        status: "enabled",
        profileName: "agent-claude",
        role: "arn:aws:iam::123456789012:role/agents",
        parentSession: "me via SSO",
        permissions: "Read-only",
        duration: "15 min",
        sourceIdentity: "yes",
        lastActivity: "2026-09-30T10:00:00.000Z credentials",
      },
      {
        id: "agent2",
        name: "codex",
        status: "disabled",
        profileName: "agent-codex",
        role: "arn:aws:iam::123456789012:role/agents",
        parentSession: "",
        permissions: "Custom policy",
        duration: "60 min",
        sourceIdentity: "no",
        lastActivity: "-",
      },
    ]);
    expect(Object.keys(tableSpy.mock.calls[0][1])).toEqual([
      "id",
      "name",
      "status",
      "profileName",
      "role",
      "parentSession",
      "permissions",
      "duration",
      "sourceIdentity",
      "lastActivity",
    ]);
    tableSpy.mockRestore();
  });
});
