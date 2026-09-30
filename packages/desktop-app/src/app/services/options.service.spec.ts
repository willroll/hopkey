import { OptionsService, proxyPasswordKeychainItemName } from "./options.service";
import { Workspace } from "@hopkey/core/models/workspace";
import { constants } from "@hopkey/core/models/constants";

describe("OptionsService", () => {
  let service: OptionsService;
  let workspace: Workspace;
  let workspaceService: any;
  let keychainService: any;
  let keychain: Map<string, string>;

  beforeEach(() => {
    workspace = new Workspace();
    workspaceService = {
      getWorkspace: () => workspace,
      persistWorkspace: jasmine.createSpy("persistWorkspace"),
    };
    keychain = new Map();
    keychainService = {
      getSecret: jasmine.createSpy("getSecret").and.callFake(async (_service, account) => keychain.get(account) ?? null),
      saveSecret: jasmine.createSpy("saveSecret").and.callFake(async (_service, account, secret) => keychain.set(account, secret)),
      deleteSecret: jasmine.createSpy("deleteSecret").and.callFake(async (_service, account) => keychain.delete(account)),
    };
    service = new OptionsService({ workspaceService, keychainService } as any);
  });

  it("keeps the proxy password in the keychain, and the rest of the proxy configuration in the workspace", async () => {
    await service.updateProxyConfiguration({
      proxyProtocol: "https",
      proxyUrl: "proxy.example.com",
      proxyPort: "8080",
      username: "me",
      password: "p4ss",
    });

    expect(keychainService.saveSecret).toHaveBeenCalledWith(constants.appName, proxyPasswordKeychainItemName, "p4ss");
    expect(workspace.proxyConfiguration).toEqual({ proxyProtocol: "https", proxyUrl: "proxy.example.com", proxyPort: "8080", username: "me" });
    expect(workspaceService.persistWorkspace).toHaveBeenCalledWith(workspace);
    expect(await service.getProxyPassword()).toBe("p4ss");
  });

  it("deletes the proxy password when it's cleared", async () => {
    keychain.set(proxyPasswordKeychainItemName, "p4ss");
    await service.updateProxyConfiguration({ proxyProtocol: "https", proxyUrl: "proxy.example.com", proxyPort: "8080", username: "", password: "" });

    expect(keychainService.deleteSecret).toHaveBeenCalledWith(constants.appName, proxyPasswordKeychainItemName);
    expect(await service.getProxyPassword()).toBe("");
  });

  it("moves a proxy password out of the workspace file", async () => {
    workspace.proxyConfiguration = { proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "3128", username: "me", password: "old" };

    await service.moveProxyPasswordToKeychain();

    expect(keychain.get(proxyPasswordKeychainItemName)).toBe("old");
    expect(workspace.proxyConfiguration).toEqual({ proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "3128", username: "me" });
    expect(workspaceService.persistWorkspace).toHaveBeenCalledWith(workspace);
  });

  it("leaves a workspace without a proxy password alone", async () => {
    await service.moveProxyPasswordToKeychain();

    expect(keychainService.saveSecret).not.toHaveBeenCalled();
    expect(workspaceService.persistWorkspace).not.toHaveBeenCalled();
  });

  it("keeps the proxy password in the workspace file when the keychain fails", async () => {
    workspace.proxyConfiguration = { proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "3128", password: "old" };
    keychainService.saveSecret.and.rejectWith(new Error("the keychain is locked"));

    await expectAsync(service.moveProxyPasswordToKeychain()).toBeRejectedWithError("the keychain is locked");
    expect(workspace.proxyConfiguration.password).toBe("old");
    expect(workspaceService.persistWorkspace).not.toHaveBeenCalled();
  });
});
