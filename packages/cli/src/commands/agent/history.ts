import { Args, Flags, ux } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { HopkeyCommand } from "../../hopkey-command";
import { AgentPermissions, agentPermissionsLabels } from "@hopkey/core/models/aws/aws-agent";

export default class AgentHistory extends HopkeyCommand {
  static description = "Show what AI agents did with their credentials, newest first";

  static examples = [`$hopkey agent history`, `$hopkey agent history AGENTNAME --limit 100`, `$hopkey agent history --output json`];

  static args = {
    agentName: Args.string({ required: false, description: "Only show this agent" }),
  };

  static flags = {
    limit: Flags.integer({ description: "Number of events to show", default: 50, min: 1 }),
    ...ux.table.flags(),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { args, flags } = await this.parse(AgentHistory);
      await this.showHistory(args.agentName, flags);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async showHistory(agentName: string | undefined, flags: any): Promise<void> {
    const { limit, ...tableFlags } = flags;
    const data = this.cliProviderService.agentService.history(agentName, limit).map((activity) => ({
      time: activity.time,
      agent: activity.agent,
      event: activity.event,
      role: activity.roleArn,
      permissions: agentPermissionsLabels[activity.permissions as AgentPermissions] ?? activity.permissions,
      requestedBy: activity.requestedBy?.join(" < ") ?? "",
      expiration: activity.expiration ?? "",
      message: activity.message ?? "",
    })) as any as Record<string, unknown>[];

    const columns = {
      time: { header: "Time" },
      agent: { header: "Agent" },
      event: { header: "Event" },
      role: { header: "Role", extended: true },
      permissions: { header: "Permissions", extended: true },
      requestedBy: { header: "Requested By" },
      expiration: { header: "Expiration", extended: true },
      message: { header: "Message" },
    };

    ux.table(data, columns, { ...tableFlags });
  }
}
