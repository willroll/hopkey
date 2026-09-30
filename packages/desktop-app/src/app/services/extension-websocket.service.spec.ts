import { ExtensionWebsocketService, FetchingState, extensionHosts, extensionPort, isExtensionOrigin } from "./extension-websocket.service";

class FakeWebSocketServer {
  static created: FakeWebSocketServer[] = [];
  handlers: { [event: string]: (arg: any) => void } = {};
  clients = new Set<any>();
  closed = false;

  constructor(public options: any) {
    FakeWebSocketServer.created.push(this);
  }

  on(event: string, handler: (arg: any) => void): FakeWebSocketServer {
    this.handlers[event] = handler;
    return this;
  }

  close(): void {
    this.closed = true;
  }
}

const fakeClient = (readyState = WebSocket.OPEN): any => {
  const client = {
    readyState,
    handlers: {} as { [event: string]: (arg: any) => void },
    send: jasmine.createSpy("send"),
    terminate: jasmine.createSpy("terminate"),
    on: (event: string, handler: (arg: any) => void) => (client.handlers[event] = handler),
  };
  return client;
};

describe("ExtensionWebsocketService", () => {
  let service: ExtensionWebsocketService;
  let optionsService: any;
  let logService: any;

  beforeEach(() => {
    FakeWebSocketServer.created = [];
    optionsService = { extensionEnabled: true };
    logService = { log: jasmine.createSpy("log") };
    service = new ExtensionWebsocketService(
      { ws: { ["WebSocketServer"]: FakeWebSocketServer } } as any,
      { logService } as any,
      { toast: jasmine.createSpy("toast") } as any,
      { openExternalUrl: jasmine.createSpy("openExternalUrl") } as any,
      optionsService
    );
  });

  afterEach(() => service.stop());

  it("doesn't listen while the extension is turned off", () => {
    optionsService.extensionEnabled = false;
    service.bootstrap();
    expect(FakeWebSocketServer.created).toEqual([]);
  });

  it("listens on the loopback addresses only, once, when the extension is turned on", () => {
    service.bootstrap();
    service.start();
    expect(FakeWebSocketServer.created.map((server) => [server.options.host, server.options.port])).toEqual([
      ["127.0.0.1", 8095],
      ["::1", 8095],
    ]);
    expect(extensionHosts).toEqual(["127.0.0.1", "::1"]);
    expect(extensionPort).toBe(8095);
  });

  it("lets in browser extensions, not web pages or other programs", () => {
    service.start();
    const verifyClient = FakeWebSocketServer.created[0].options.verifyClient;
    expect(verifyClient({ origin: "chrome-extension://bdoehpgipmjflkmnnongpafgbhilicnl" })).toBeTrue();
    expect(verifyClient({ origin: "moz-extension://0f1e2d3c-4b5a-4978-8a9b-0c1d2e3f4a5b" })).toBeTrue();
    expect(verifyClient({ origin: "https://example.com" })).toBeFalse();
    expect(verifyClient({ origin: "http://localhost:4200" })).toBeFalse();
    expect(verifyClient({ origin: "null" })).toBeFalse();
    expect(verifyClient({})).toBeFalse();
    expect(isExtensionOrigin("chrome-extension://bdoehpgipmjflkmnnongpafgbhilicnl/page.html")).toBeFalse();
  });

  it("logs an address it can't listen on instead of failing", () => {
    service.start();
    FakeWebSocketServer.created[1].handlers.error(new Error("listen EAFNOSUPPORT: address family not supported ::1:8095"));
    expect(logService.log).toHaveBeenCalledTimes(1);
    expect(logService.log.calls.mostRecent().args[0].message).toBe(
      "The browser extension server can't listen on ::1:8095: listen EAFNOSUPPORT: address family not supported ::1:8095"
    );
  });

  it("sends messages to the connected extensions on every address", () => {
    service.start();
    const [ipv4Client, ipv6Client, closingClient] = [fakeClient(), fakeClient(), fakeClient(WebSocket.CLOSING)];
    FakeWebSocketServer.created[0].clients.add(ipv4Client).add(closingClient);
    FakeWebSocketServer.created[1].clients.add(ipv6Client);

    service.sendMessage("payload");
    expect(ipv4Client.send).toHaveBeenCalledWith("payload");
    expect(ipv6Client.send).toHaveBeenCalledWith("payload");
    expect(closingClient.send).not.toHaveBeenCalled();
  });

  it("stops listening and disconnects the extensions when the extension is turned off", () => {
    service.start();
    const client = fakeClient();
    FakeWebSocketServer.created[0].clients.add(client);

    service.stop();
    expect(FakeWebSocketServer.created.every((server) => server.closed)).toBeTrue();
    expect(client.terminate).toHaveBeenCalled();
    service.sendMessage("payload");
    expect(client.send).not.toHaveBeenCalled();

    service.start();
    expect(FakeWebSocketServer.created.length).toBe(4);
  });

  it("follows the fetching state the extension reports, and ignores malformed messages", () => {
    service.start();
    const client = fakeClient();
    FakeWebSocketServer.created[0].handlers.connection(client);
    service.fetching$.next(FetchingState.fetchingRequested);

    client.handlers.message("not json");
    expect(service.fetching$.value).toBe(FetchingState.fetchingRequested);
    client.handlers.message(JSON.stringify({ type: "send-fetching-state", fetching: false }));
    expect(service.fetching$.value).toBe(FetchingState.notFetching);
  });
});
