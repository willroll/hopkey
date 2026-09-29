import { describe, test, expect, jest } from "@jest/globals";
import { HopkeyCommand } from "./hopkey-command";
import { SessionType } from "@hopkey/core/models/session-type";

describe("HopkeyCommand", () => {
  test("init", async () => {
    const cliProviderService = {
      awsSsoRoleService: {
        setAwsIntegrationDelegate: jest.fn(),
      },
      awsSsoIntegrationService: "integrationService",
      remoteProceduresClient: {
        isDesktopAppRunning: jest.fn(async () => true),
      },
      teamService: {
        setCurrentWorkspace: jest.fn(),
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    };

    const hopkeyCommand = new (HopkeyCommand as any)(null, null, cliProviderService);
    await hopkeyCommand.init();

    expect(cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate).toHaveBeenCalledWith(cliProviderService.awsSsoIntegrationService);
    expect(cliProviderService.remoteProceduresClient.isDesktopAppRunning).toHaveBeenCalled();
    expect(cliProviderService.teamService.setCurrentWorkspace).toHaveBeenCalledWith(true);
  });

  test("init - desktop app not running", async () => {
    const cliProviderService = {
      awsSsoRoleService: {
        setAwsIntegrationDelegate: jest.fn(),
      },
      awsSsoIntegrationService: "integrationService",
      remoteProceduresClient: {
        isDesktopAppRunning: jest.fn(async () => false),
      },
      teamService: {
        setCurrentWorkspace: jest.fn(),
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    };

    const hopkeyCommand = new (HopkeyCommand as any)(null, null, cliProviderService);
    hopkeyCommand.error = jest.fn();
    await hopkeyCommand.init();

    expect(cliProviderService.awsSsoRoleService.setAwsIntegrationDelegate).toHaveBeenCalledWith(cliProviderService.awsSsoIntegrationService);
    expect(cliProviderService.remoteProceduresClient.isDesktopAppRunning).toHaveBeenCalled();
    expect(hopkeyCommand.error).toHaveBeenCalledWith(
      "Hopkey app must be running to use this CLI. You can download it here: https://www.leapp.cloud/releases"
    );
    expect(cliProviderService.teamService.setCurrentWorkspace).not.toHaveBeenCalled();
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
