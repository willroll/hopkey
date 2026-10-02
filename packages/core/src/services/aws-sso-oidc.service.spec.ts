import { describe, expect, jest, test } from "@jest/globals";
import { AwsSsoOidcService } from "./aws-sso-oidc.service";

describe("AwsSsoOidcService", () => {
  test("login - creates the SSO OIDC client with the request handler it was given", async () => {
    const httpHandler = { handle: jest.fn() } as any;
    const service = new AwsSsoOidcService(null, null, false, httpHandler) as any;
    service.registerSsoOidcClient = jest.fn(async () => {
      throw new Error("registration stopped by the test");
    });

    await expect(service.login("integration-id", "eu-west-1", "https://portal.example.com")).rejects.toThrow("registration stopped by the test");

    await expect(service.ssoOidc.config.region()).resolves.toBe("eu-west-1");
    expect(service.ssoOidc.config.requestHandler).toBe(httpHandler);
  });
});
