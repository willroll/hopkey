/* eslint-disable @typescript-eslint/naming-convention */
import { jest, describe, test, expect } from "@jest/globals";
import { ExecuteService } from "./execute-service";

describe("ExecuteService", () => {
  test("execute, command without sudo, not darwin os", async () => {
    const nativeService = { exec: "fake-exec-fn", process: { platform: "win32" } } as any;
    const service = new ExecuteService(nativeService, null, null) as any;
    service.exec = jest.fn(async () => "fake-exec-result");

    const result = await service.execute("fake-command", "fake-env", "fake-maskOutputLog");

    expect(service.exec).toHaveBeenCalledWith("fake-exec-fn", "fake-command", "fake-env", "fake-maskOutputLog");
    expect(result).toBe("fake-exec-result");
  });

  test("execute, command with sudo, not darwin os", async () => {
    const nativeService = { exec: "fake-exec-fn", sudo: { exec: "fake-sudo-exec-fn" }, process: { platform: "win32" } } as any;
    const service = new ExecuteService(nativeService, null, null) as any;
    service.exec = jest.fn(async () => "fake-exec-result");

    const result = await service.execute("sudo fake-command", "fake-env", "fake-maskOutputLog");

    expect(service.exec).toHaveBeenCalledWith("fake-sudo-exec-fn", "fake-command", "fake-env", "fake-maskOutputLog");
    expect(result).toBe("fake-exec-result");
  });

  test("execute, sends the programs it starts through the proxy set in the options", async () => {
    const nativeService = { exec: "fake-exec-fn", process: { platform: "win32", env: { PATH: "/usr/bin" } } } as any;
    const proxyService = { environment: { HTTPS_PROXY: "http://proxy.example.com:3128" } } as any;
    const service = new ExecuteService(nativeService, null, null, proxyService) as any;
    service.exec = jest.fn(async () => "fake-exec-result");

    await service.execute("az login");
    expect(service.exec).toHaveBeenLastCalledWith(
      "fake-exec-fn",
      "az login",
      { PATH: "/usr/bin", HTTPS_PROXY: "http://proxy.example.com:3128" },
      undefined
    );

    await service.execute("az account show", { AZURE_CONFIG_DIR: "/tmp/az" });
    expect(service.exec).toHaveBeenLastCalledWith(
      "fake-exec-fn",
      "az account show",
      { AZURE_CONFIG_DIR: "/tmp/az", HTTPS_PROXY: "http://proxy.example.com:3128" },
      undefined
    );
  });

  test("execute, leaves the environment alone without a proxy, and under sudo", async () => {
    const nativeService = { exec: "fake-exec-fn", sudo: { exec: "fake-sudo-exec-fn" }, process: { platform: "win32", env: {} } } as any;
    const withoutProxy = new ExecuteService(nativeService, null, null, { environment: {} } as any) as any;
    withoutProxy.exec = jest.fn(async () => "");
    await withoutProxy.execute("az login");
    expect(withoutProxy.exec).toHaveBeenCalledWith("fake-exec-fn", "az login", undefined, undefined);

    const underSudo = new ExecuteService(nativeService, null, null, { environment: { HTTPS_PROXY: "http://proxy.example.com:3128" } } as any) as any;
    underSudo.exec = jest.fn(async () => "");
    await underSudo.execute("sudo fake-command", "fake-env");
    expect(underSudo.exec).toHaveBeenCalledWith("fake-sudo-exec-fn", "fake-command", "fake-env", undefined);
  });
});
