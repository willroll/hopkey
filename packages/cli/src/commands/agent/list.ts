import { ux } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { HopkeyCommand } from "../../hopkey-command";
import { agentPermissionsLabels } from "@hopkey/core/models/aws/aws-agent";

export default class ListAgents extends HopkeyCommand {
  static description = "Show the AI agents, what they may do and when they last got credentials";

  static examples = [`$hopkey agent list`, `$hopkey agent list -x`, `$hopkey agent list --output json`];

  static flags = {
    ...ux.table.flags(),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      await this.showAgents();
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async showAgents(): Promise<void> {
    const { flags } = await this.parse(ListAgents);
    const data = this.cliProviderService.agentService.listAgents().map((agent) => ({
      id: agent.sessionId,
      name: agent.name,
      status: agent.enabled ? "enabled" : "disabled",
      profileName: agent.profileName,
      role: agent.roleArn,
      parentSession: agent.parentSessionName,
      permissions: agentPermissionsLabels[agent.permissions],
      duration: `${agent.durationSeconds / 60} min`,
      sourceIdentity: agent.setSourceIdentity ? "yes" : "no",
      lastActivity: agent.lastActivity ? `${agent.lastActivity.time} ${agent.lastActivity.event}` : "-",
    })) as any as Record<string, unknown>[];

    const columns = {
      id: { header: "ID", extended: true },
      name: { header: "Agent" },
      status: { header: "Status" },
      profileName: { header: "Named Profile" },
      role: { header: "Role" },
      parentSession: { header: "Assumed From", extended: true },
      permissions: { header: "Permissions" },
      duration: { header: "Credentials Last" },
      sourceIdentity: { header: "Source Identity", extended: true },
      lastActivity: { header: "Last Activity" },
    };

    ux.table(data, columns, { ...flags });
  }
}
