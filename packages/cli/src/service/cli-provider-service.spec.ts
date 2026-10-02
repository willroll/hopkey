import { describe, test, expect } from "@jest/globals";
import { CliProviderService } from "./cli-provider-service";

describe("CliProviderService", () => {
  test("services", async () => {
    for (const propertyName of Object.keys(Object.getOwnPropertyDescriptors(CliProviderService.prototype))) {
      const cliProviderService = new CliProviderService();

      let result;
      try {
        result = cliProviderService[propertyName];
      } catch (e) {
        throw new Error(`error getting: ${propertyName}`);
      }

      try {
        expect(result).not.toBeFalsy();
      } catch (e) {
        throw new Error(`${propertyName} is falsy`);
      }

      try {
        expect(cliProviderService[propertyName]).toBe(result);
      } catch (error) {
        throw new Error(`singleton not working for ${propertyName}`);
      }
    }
  });

  test("remoteProceduresClient", async () => {
    const cliProviderService = new CliProviderService();
    const cliNativeService = cliProviderService.cliNativeService;
    expect(cliNativeService.msalEncryptionService).toBeNull();

    const remoteProceduresClient = cliProviderService.remoteProceduresClient;
    expect(remoteProceduresClient).not.toBeFalsy();

    expect(cliNativeService.msalEncryptionService).not.toBeFalsy();
    expect(cliNativeService.msalEncryptionService.protectData).not.toBeFalsy();
    expect(cliNativeService.msalEncryptionService.unprotectData).not.toBeFalsy();
  });

  test("the AWS clients and the programs it starts go through the proxy loaded at startup", async () => {
    const cliProviderService = new CliProviderService();
    cliProviderService.cliNativeService.useProxy("http://me:secret@proxy.example.com:3128");

    const httpHandler = cliProviderService.awsCoreService.httpHandler as any;
    const config = await httpHandler.configProvider;
    expect(config.httpAgent).toBe(cliProviderService.cliNativeService.proxyAgents.httpAgent);
    expect(config.httpsAgent).toBe(cliProviderService.cliNativeService.proxyAgents.httpsAgent);
    expect((cliProviderService.awsSsoOidcService as any).httpHandler).toBe(httpHandler);
    expect((cliProviderService.awsSsoIntegrationService as any).httpHandler).toBe(httpHandler);
    expect((cliProviderService.ssmService as any).httpHandler).toBe(httpHandler);
    expect((cliProviderService.executeService as any).proxyService).toBe(cliProviderService.proxyService);
  });
});
