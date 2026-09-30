import { Injectable } from "@angular/core";
import { AppNativeService } from "./app-native.service";
import { AppProviderService } from "./app-provider.service";
import { Session } from "@hopkey/core/models/session";
import { AwsSessionService } from "@hopkey/core/services/session/aws/aws-session-service";
import { BehaviorSubject } from "rxjs";
import { MessageToasterService, ToastLevel } from "./message-toaster.service";
import { WindowService } from "./window.service";
import { OptionsService } from "./options.service";
import { LoggedEntry, LogLevel } from "@hopkey/core/services/log-service";

export enum FetchingState {
  notFetching,
  fetchingRequested,
  fetching,
}

export const extensionPort = 8095;
// The Multi-Console extension connects to localhost, which can resolve to either loopback address
export const extensionHosts = ["127.0.0.1", "::1"];
// The extension connects from its background page, whose origin is the extension itself: web pages have http(s) origins
const extensionOrigin = /^(chrome-extension|moz-extension|safari-web-extension):\/\/[^/]+$/;
export const isExtensionOrigin = (origin?: string): boolean => extensionOrigin.test(origin ?? "");

@Injectable({
  providedIn: "root",
})
export class ExtensionWebsocketService {
  public fetching$: BehaviorSubject<FetchingState>;
  private wsServers: any[] = [];
  private fetchingTimeout: any;
  private consoleUrl: string;

  constructor(
    private appNativeService: AppNativeService,
    private appProviderService: AppProviderService,
    private toastService: MessageToasterService,
    private windowService: WindowService,
    private optionsService: OptionsService
  ) {
    this.fetching$ = new BehaviorSubject(FetchingState.notFetching);
    this.fetching$.subscribe(async (value) => {
      clearTimeout(this.fetchingTimeout);
      if (value === FetchingState.fetching) {
        await this.pause();
        this.sendMessage(JSON.stringify({ type: "get-fetching-state" }));
        this.fetchingTimeout = setTimeout(() => {
          this.fetching$.next(FetchingState.notFetching);
          try {
            this.windowService.openExternalUrl(this.consoleUrl);
            this.toastService.toast(
              "Communication Error. Be sure to have your browser open and the extension installed. Opening it with the standard method...",
              ToastLevel.warn
            );
          } catch (err) {
            this.toastService.toast("An error occured while opening the web console. Malformed session information", ToastLevel.error);
          } finally {
            this.consoleUrl = undefined;
          }
        }, 4000);
      }
    });
  }

  bootstrap(): void {
    if (this.optionsService.extensionEnabled) {
      this.start();
    }
  }

  /**
   * Listens for the Multi-Console extension on the loopback addresses only, and lets in browser extensions only: the web
   * console URLs it sends sign in to AWS
   */
  start(): void {
    if (this.wsServers.length > 0) {
      return;
    }
    const ws = this.appNativeService.ws;
    this.wsServers = extensionHosts.map((host) => {
      const wsServer = new ws.WebSocketServer({ host, port: extensionPort, verifyClient: (info) => isExtensionOrigin(info.origin) });
      wsServer.on("error", (error) => {
        const message = `The browser extension server can't listen on ${host}:${extensionPort}: ${error.message}`;
        this.appProviderService.logService.log(new LoggedEntry(message, this, LogLevel.warn));
      });
      wsServer.on("connection", (wsClient) => wsClient.on("message", (data) => this.receive(data)));
      return wsServer;
    });
  }

  stop(): void {
    for (const wsServer of this.wsServers) {
      wsServer.clients.forEach((client) => client.terminate());
      wsServer.close();
    }
    this.wsServers = [];
  }

  sendMessage(payload: any): void {
    for (const wsServer of this.wsServers) {
      wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  }

  async openWebConsoleWithExtension(session: Session): Promise<void> {
    this.fetching$.next(FetchingState.fetchingRequested);
    this.appProviderService.behaviouralSubjectService.unselectSessions();
    const sessionService = this.appProviderService.sessionFactory.getSessionService(session.type) as AwsSessionService;
    let credentialsInfo;
    try {
      credentialsInfo = await sessionService.generateCredentials(session.sessionId);
    } catch (error) {
      this.fetching$.next(FetchingState.notFetching);
      throw error;
    }
    this.consoleUrl = await this.appProviderService.webConsoleService.getWebConsoleUrl(credentialsInfo, session.region);
    this.sendMessage(
      JSON.stringify({
        type: "create-new-session",
        sessionInfo: {
          url: this.consoleUrl,
          sessionName: session.sessionName,
          sessionRole: (session as any).roleArn.split("/")[1],
          sessionRegion: session.region,
          sessionType: session.type.toString().startsWith("aws") ? "aws" : session.type.toString(),
          createdAt: new Date().getTime(),
        },
        leappSessionId: session.sessionId,
      })
    );
    this.fetching$.next(FetchingState.fetching);
    this.toastService.toast("Opening Web Console with the Multi-Console Extension...", ToastLevel.info);
  }

  private receive(data: any): void {
    let parsedData;
    try {
      parsedData = JSON.parse(data.toString("utf8"));
    } catch (_) {
      return;
    }
    if (parsedData?.type === "send-fetching-state") {
      this.fetching$.next(parsedData.fetching ? FetchingState.fetching : FetchingState.notFetching);
    }
  }

  private pause(): Promise<void> {
    return new Promise((resolve, _) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 300);
    });
  }
}
