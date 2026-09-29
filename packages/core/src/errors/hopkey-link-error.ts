import { LogLevel } from "../services/log-service";
import { HopkeyBaseError } from "./hopkey-base-error";

export class HopkeyLinkError extends HopkeyBaseError {
  link;
  constructor(link: string, context: any, message?: string) {
    super("Error", context, LogLevel.error, message);
    this.link = link;
  }
}
