import { describe, test, expect, jest } from "@jest/globals";
import { HopkeyCommand } from "./hopkey-command";
import { SessionType } from "@hopkey/core/models/session-type";

describe("HopkeyCommand", () => {
  const providerFor = (desktopAppRunning: boolean, proxyUrl?: string, loadError?: Error) => {
    const calls: string[] = [];
    const cliProviderService = {
      awsSsoRoleService: {
        setAwsIntegrationDelegate: jest.fn(() => calls.push("setAwsIntegrationDelegate")),
      },
      awsSsoIntegrationService: "integrationService",
      remoteProceduresClient: {
        isDesktopAppRunning: jest.fn(async () => desktopAppRunning),
      },
      proxyService: {
        url: proxyUrl,
        load: jest.fn(async () => {
          calls.push("load");
          if (loadError) {
            throw loadError;
          }
        }),
      },
      cliNativeService: {
        useProxy: jest.fn(() => calls.push("useProxy")),
      },
    };
    return { cliProviderService, calls };
  };

  // Like oclif's, the error stops the command
  const exit = jest.fn((message: string) => {
    throw new Error(message);
  });

  test("init - loads the proxy before creating the AWS clients", async () => {
    const { cliProviderService, calls } = providerFor(true, "http://proxy.example.com:3128");

    const hopkeyCommand = new (HopkeyCommand as any)(null, null, cliProviderService);
    await hopkeyCommand.init();

    expect(cliProviderService.remoteProceduresClient.isDesktopAppRunning).toHaveBeenCalled();
    expect(cliProviderService.cliNativeService.useProxy).toHaveBeenCalledWith("http://proxy.example.com:3128");
    expect(cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate).toHaveBeenCalledWith(cliProviderService.awsSsoIntegrationService);
    expect(calls).toEqual(["load", "useProxy", "setAwsIntegrationDelegate"]);
  });

  test("init - desktop app not running", async () => {
    const { cliProviderService } = providerFor(false);

    const hopkeyCommand = new (HopkeyCommand as any)(null, null, cliProviderService);
    hopkeyCommand.error = exit;
    await expect(hopkeyCommand.init()).rejects.toThrow(
      "Hopkey app must be running to use this CLI. You can download it here: https://github.com/willroll/hopkey/releases"
    );

    expect(cliProviderService.proxyService.load).not.toHaveBeenCalled();
    expect(cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate).not.toHaveBeenCalled();
  });

  test("init - stops when the proxy in the options can't be used", async () => {
    const { cliProviderService } = providerFor(
      true,
      undefined,
      new Error("Hopkey can't use the proxy in the options: \"31a28\" isn't a port number")
    );

    const hopkeyCommand = new (HopkeyCommand as any)(null, null, cliProviderService);
    hopkeyCommand.error = exit;
    await expect(hopkeyCommand.init()).rejects.toThrow(`Hopkey can't use the proxy in the options: "31a28" isn't a port number`);

    expect(cliProviderService.cliNativeService.useProxy).not.toHaveBeenCalled();
    expect(cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate).not.toHaveBeenCalled();
  });

  test("unsupportedAzureSession - azure session should throw an error", async () => {
    const mockedSession = { type: SessionType.azure };
    const hopkeyCommand = new (HopkeyCommand as any)(null, null, null);
    hopkeyCommand.error = jest.fn();
    expect(() => hopkeyCommand.unsupportedAzureSession(mockedSession)).toThrow(new Error("Azure sessions not supported for this command"));
  });

  test("unsupportedAzureSession - anything else then an azure session should not throw an error", async () => {
    const mockedSession = { type: SessionType.awsIamUser };
    const hopkeyCommand = new (HopkeyCommand as any)(null, null, null);
    hopkeyCommand.error = jest.fn();
    expect(() => hopkeyCommand.unsupportedAzureSession(mockedSession)).not.toThrow();
  });

  test("unsupportedAzureSession - undefined should not throw an error", async () => {
    const mockedSession = undefined;
    const hopkeyCommand = new (HopkeyCommand as any)(null, null, null);
    hopkeyCommand.error = jest.fn();
    expect(() => hopkeyCommand.unsupportedAzureSession(mockedSession)).not.toThrow();
  });
});
