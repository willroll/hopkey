import { constants } from "../models/constants";
import { IKeychainService } from "../interfaces/i-keychain-service";
import { Repository } from "./repository";
import { LoggedException, LogLevel } from "./log-service";

export interface ProxyConfiguration {
  proxyProtocol: string;
  proxyUrl?: string;
  proxyPort: string;
  username?: string;
  password?: string;
}

// The proxy password is a secret: it's kept in the keychain, not in the workspace file
export const proxyPasswordKeychainItemName = "proxy-password";

/**
 * The proxy's URL, with its user and password percent-encoded, or undefined when the configuration has no host
 *
 * @throws LoggedException when the configuration isn't a proxy Hopkey can use
 */
export const proxyUrl = (configuration: ProxyConfiguration | undefined, password?: string): string | undefined => {
  // The host field may also hold a scheme or a trailing slash, which the URL gets from the other fields
  const host = (configuration?.proxyUrl ?? "")
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/\/+$/, "");
  if (!host || host === "undefined") {
    return undefined;
  }
  const protocol = (configuration.proxyProtocol || "http").toLowerCase();
  const port = `${configuration.proxyPort ?? ""}`.trim();
  let url: URL;
  try {
    url = new URL(`${protocol}://${host}`);
  } catch (_) {
    throw new LoggedException(`Hopkey can't use the proxy in the options: "${host}" isn't a host name`, null, LogLevel.warn);
  }
  if (!["http", "https"].includes(protocol)) {
    throw new LoggedException(`Hopkey can't use the proxy in the options: it supports HTTP and HTTPS proxies, not ${protocol}`, null, LogLevel.warn);
  }
  if (port && !(/^\d+$/.test(port) && +port > 0 && +port < 65536)) {
    throw new LoggedException(`Hopkey can't use the proxy in the options: "${port}" isn't a port number`, null, LogLevel.warn);
  }
  if (port) {
    url.port = port;
  }
  if (configuration.username) {
    url.username = encodeURIComponent(configuration.username);
    if (password) {
      url.password = encodeURIComponent(password);
    }
  }
  return url.toString().replace(/\/$/, "");
};

/**
 * The proxy set in the options (General → Proxy settings). The app and the CLI load it at startup, and the app again
 * when the options change. Each one then sends its connections through it: the app through its Electron sessions, the
 * CLI through Node agents, and both pass it on to the programs they start, such as the Azure CLI.
 */
export class ProxyService {
  private currentUrl: string | undefined;

  constructor(private repository: Repository, private keychainService: IKeychainService) {}

  /**
   * The proxy as a URL, with its user and password percent-encoded, or undefined when there's no proxy
   */
  get url(): string | undefined {
    return this.currentUrl;
  }

  /**
   * Environment variables that send the programs Hopkey starts, such as the Azure and AWS CLIs, through the proxy
   */
  get environment(): { [name: string]: string } {
    if (!this.currentUrl) {
      return {};
    }
    const environment: { [name: string]: string } = {};
    for (const name of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]) {
      environment[name] = this.currentUrl;
    }
    for (const name of ["NO_PROXY", "no_proxy"]) {
      environment[name] = "localhost,127.0.0.1,::1";
    }
    return environment;
  }

  async load(): Promise<void> {
    const configuration: ProxyConfiguration | undefined = this.repository.getProxyConfiguration();
    const password = configuration?.username ? await this.keychainService.getSecret(constants.appName, proxyPasswordKeychainItemName) : undefined;
    this.currentUrl = proxyUrl(configuration, password ?? undefined);
  }
}
