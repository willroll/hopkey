import { Command } from "@oclif/core";
import { Config } from "@oclif/core/lib/config/config";
import { CliProviderService } from "./service/cli-provider-service";
import { SessionType } from "@hopkey/core/models/session-type";
import { Session } from "@hopkey/core/models/session";

export abstract class HopkeyCommand extends Command {
  protected constructor(argv: string[], config: Config, protected cliProviderService = new CliProviderService()) {
    super(argv, config);
  }

  protected static areFlagsNotDefined(flags: any, instance: any): boolean {
    let enableInteractiveMode = true;
    Object.keys(flags).forEach((key) => {
      if (Object.keys(instance.constructor.flags).includes(key)) {
        //if the command contains at least a flag, do not switch to interactive mode
        if (flags[key] !== undefined) {
          enableInteractiveMode = false;
        }
      }
    });
    return enableInteractiveMode;
  }

  async init(): Promise<void> {
    const isDesktopAppRunning = await this.cliProviderService.remoteProceduresClient.isDesktopAppRunning();
    if (!isDesktopAppRunning) {
      this.error("Hopkey app must be running to use this CLI. You can download it here: https://github.com/willroll/hopkey/releases");
    }
    // Before the first AWS client is created: they all take the proxy from the native service
    await this.useProxy();
    this.cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate(this.cliProviderService.awsSsoIntegrationService);
  }

  unsupportedAzureSession(session: Session): void {
    if (session && session.type === SessionType.azure) {
      throw new Error("Azure sessions not supported for this command");
    }
  }

  private async useProxy(): Promise<void> {
    try {
      await this.cliProviderService.proxyService.load();
    } catch (error: any) {
      this.error(error.message);
    }
    this.cliProviderService.cliNativeService.useProxy(this.cliProviderService.proxyService.url);
  }
}
