import { Args } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { HopkeyCommand } from "../../hopkey-command";
import { force } from "../../flags";

export default class RemoveAgent extends HopkeyCommand {
  static description = "Remove an AI agent; its named profile and its activity history stay";

  static examples = [`$hopkey agent remove AGENTNAME`, `$hopkey agent remove AGENTNAME --force`];

  static args = {
    agentName: Args.string({ required: true, description: "Name of the agent" }),
  };

  static flags = {
    force,
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { args, flags } = await this.parse(RemoveAgent);
      this.cliProviderService.agentService.getAgentSession(args.agentName);
      if (flags.force || (await this.askForConfirmation(args.agentName))) {
        await this.removeAgent(args.agentName);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async askForConfirmation(agentName: string): Promise<boolean> {
    const answer: any = await this.cliProviderService.inquirer.prompt([
      { name: "confirmation", message: `remove the agent ${agentName}?`, type: "confirm" },
    ]);
    return answer.confirmation;
  }

  async removeAgent(agentName: string): Promise<void> {
    try {
      await this.cliProviderService.agentService.remove(agentName);
      this.log(`agent ${agentName} removed`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }
}
