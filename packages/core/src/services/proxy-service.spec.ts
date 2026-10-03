/* eslint-disable @typescript-eslint/naming-convention */
import { describe, expect, jest, test } from "@jest/globals";
import { ProxyConfiguration, proxyPasswordKeychainItemName, ProxyService } from "./proxy-service";
import { constants } from "../models/constants";

describe("ProxyService", () => {
  const proxyService = (configuration: Partial<ProxyConfiguration> | undefined, password: string | null = null) => {
    const keychainService = { getSecret: jest.fn(async () => password) };
    const service = new ProxyService({ getProxyConfiguration: () => configuration } as any, keychainService as any);
    return { service, keychainService };
  };

  test("no proxy when there's no host", async () => {
    for (const configuration of [
      undefined,
      { proxyProtocol: "https", proxyPort: "8080" },
      { proxyProtocol: "https", proxyUrl: " ", proxyPort: "8080" },
    ]) {
      const { service } = proxyService(configuration);
      await service.load();
      expect(service.url).toBeUndefined();
      expect(service.environment).toEqual({});
    }
  });

  test("ignores the 'undefined' host that older versions saved", async () => {
    const { service } = proxyService({ proxyProtocol: "https", proxyUrl: "undefined", proxyPort: "8080" });
    await service.load();
    expect(service.url).toBeUndefined();
  });

  test("builds the proxy URL from the protocol, host and port", async () => {
    const { service, keychainService } = proxyService({ proxyProtocol: "HTTP", proxyUrl: "proxy.example.com", proxyPort: "3128" });
    await service.load();
    expect(service.url).toBe("http://proxy.example.com:3128");
    expect(keychainService.getSecret).not.toHaveBeenCalled();
  });

  test("takes the protocol and port from their fields when the host has them too", async () => {
    const { service } = proxyService({ proxyProtocol: "https", proxyUrl: "http://proxy.example.com/", proxyPort: "8443" });
    await service.load();
    expect(service.url).toBe("https://proxy.example.com:8443");
  });

  test("keeps a port written in the host when the port field is empty", async () => {
    const { service } = proxyService({ proxyProtocol: "http", proxyUrl: "proxy.example.com:3128", proxyPort: "" });
    await service.load();
    expect(service.url).toBe("http://proxy.example.com:3128");
  });

  test("refuses a proxy it can't use", async () => {
    const refusals: [Partial<ProxyConfiguration>, string][] = [
      [{ proxyProtocol: "http", proxyUrl: "proxy example", proxyPort: "3128" }, `"proxy example" isn't a host name`],
      [{ proxyProtocol: "socks5", proxyUrl: "proxy.example.com", proxyPort: "1080" }, "it supports HTTP and HTTPS proxies, not socks5"],
      [{ proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "31a28" }, `"31a28" isn't a port number`],
      [{ proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "70000" }, `"70000" isn't a port number`],
    ];
    for (const [configuration, reason] of refusals) {
      const { service } = proxyService(configuration);
      await expect(service.load()).rejects.toThrow(`Hopkey can't use the proxy in the options: ${reason}`);
    }
  });

  test("adds the user, and the password from the keychain, percent-encoded", async () => {
    const { service, keychainService } = proxyService(
      { proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "3128", username: "me@corp" },
      "p@ss:w%rd"
    );
    await service.load();
    expect(keychainService.getSecret).toHaveBeenCalledWith(constants.appName, proxyPasswordKeychainItemName);
    expect(service.url).toBe("http://me%40corp:p%40ss%3Aw%25rd@proxy.example.com:3128");
    const url = new URL(service.url);
    expect([decodeURIComponent(url.username), decodeURIComponent(url.password)]).toEqual(["me@corp", "p@ss:w%rd"]);
  });

  test("leaves the password out when the keychain has none", async () => {
    const { service } = proxyService({ proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "3128", username: "me" });
    await service.load();
    expect(service.url).toBe("http://me@proxy.example.com:3128");
  });

  test("environment sends programs through the proxy, except to this computer", async () => {
    const { service } = proxyService({ proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "3128" });
    await service.load();
    expect(service.environment).toEqual({
      HTTP_PROXY: "http://proxy.example.com:3128",
      HTTPS_PROXY: "http://proxy.example.com:3128",
      http_proxy: "http://proxy.example.com:3128",
      https_proxy: "http://proxy.example.com:3128",
      NO_PROXY: "localhost,127.0.0.1,::1",
      no_proxy: "localhost,127.0.0.1,::1",
    });
  });

  test("load picks up changed options", async () => {
    let configuration: Partial<ProxyConfiguration> = { proxyProtocol: "http", proxyUrl: "proxy.example.com", proxyPort: "3128" };
    const service = new ProxyService({ getProxyConfiguration: () => configuration } as any, { getSecret: async () => null } as any);
    await service.load();
    configuration = { proxyProtocol: "http", proxyUrl: "", proxyPort: "3128" };
    await service.load();
    expect(service.url).toBeUndefined();
  });
});
