import { HopkeyCommand } from "../hopkey-command";
import { Config } from "@oclif/core/lib/config/config";
import { constants } from "@hopkey/core/models/constants";

export default class Workspace extends HopkeyCommand {
  static description = "Show the current workspace";

  static examples = [`$hopkey workspace`];

  static flags = {};

  constructor(argv: string[], config: Config) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const workspaceState = this.cliProviderService.teamService.workspacesState.getValue().find((tmpWorkspaceState) => tmpWorkspaceState.selected);
      if (workspaceState.id === constants.localWorkspaceKeychainValue) {
        this.log("local");
      } else {
        this.log(workspaceState.name);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }
}
