import { describe, expect, test } from "@jest/globals";
import * as http from "http";
import { CliNativeService } from "./cli-native-service";

describe("CliNativeService", () => {
  test("fetch goes through the proxy given to useProxy", async () => {
    const requests: { url: string; authorization: string }[] = [];
    const proxy = http.createServer((request, response) => {
      requests.push({ url: request.url, authorization: request.headers["proxy-authorization"] as string });
      response.end("answered by the proxy");
    });
    await new Promise<void>((resolve) => proxy.listen(0, "127.0.0.1", resolve));
    try {
      const nativeService = new CliNativeService();
      nativeService.useProxy(`http://me:p%40ss@127.0.0.1:${(proxy.address() as any).port}`);

      const response = await nativeService.fetch("http://hopkey.test/path?query=1");

      expect(await response.text()).toBe("answered by the proxy");
      expect(requests).toEqual([{ url: "http://hopkey.test/path?query=1", authorization: `Basic ${Buffer.from("me:p@ss").toString("base64")}` }]);
    } finally {
      proxy.close();
    }
  });

  test("useProxy without a proxy connects directly", () => {
    const nativeService = new CliNativeService();
    nativeService.useProxy("http://proxy.example.com:3128");
    nativeService.useProxy(undefined);
    expect(nativeService.proxyAgents).toBeUndefined();
  });
});
