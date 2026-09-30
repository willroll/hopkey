import { Args } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { HopkeyCommand } from "../../hopkey-command";

export default class DisableAgent extends HopkeyCommand {
  static description = "Stop handing an AI agent credentials; the ones it already got work until they expire";

  static examples = [`$hopkey agent disable AGENTNAME`];

  static args = {
    agentName: Args.string({ required: true, description: "Name of the agent" }),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { args } = await this.parse(DisableAgent);
      await this.disableAgent(args.agentName);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async disableAgent(agentName: string): Promise<void> {
    try {
      const agentService = this.cliProviderService.agentService;
      await agentService.disable(agentName);
      const minutes = agentService.getAgentSession(agentName).agent.durationSeconds / 60;
      this.log(`agent ${agentName} disabled: credentials it already got work for up to ${minutes} more minutes`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }
}
