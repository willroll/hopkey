import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";

export class HopkeyNotAwsAccountError extends HopkeyBaseError {
  constructor(context: any, message?: string) {
    super("Hopkey Not aws Account Error", context, LogLevel.warn, message);
  }
}
