import { Args } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { HopkeyCommand } from "../../hopkey-command";

export default class EnableAgent extends HopkeyCommand {
  static description = "Let an AI agent get credentials through its named profile";

  static examples = [`$hopkey agent enable AGENTNAME`];

  static args = {
    agentName: Args.string({ required: true, description: "Name of the agent" }),
  };

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { args } = await this.parse(EnableAgent);
      await this.enableAgent(args.agentName);
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async enableAgent(agentName: string): Promise<void> {
    try {
      const agentService = this.cliProviderService.agentService;
      await agentService.enable(agentName);
      const profileName = this.cliProviderService.namedProfilesService.getProfileName(agentService.getAgentSession(agentName).profileId);
      this.log(`agent ${agentName} enabled: it gets credentials with AWS_PROFILE=${profileName}`);
    } finally {
      await this.cliProviderService.remoteProceduresClient.refreshSessions();
    }
  }
}
