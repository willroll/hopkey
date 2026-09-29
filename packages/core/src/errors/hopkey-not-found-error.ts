import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";

export class HopkeyNotFoundError extends HopkeyBaseError {
  constructor(context: any, message?: string) {
    super("Hopkey Not Found Error", context, LogLevel.warn, message);
  }
}
