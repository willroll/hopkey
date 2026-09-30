import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";

export class HopkeyMissingMfaTokenError extends HopkeyBaseError {
  constructor(context: any, message: string) {
    super("Hopkey Missing Mfa Token Error", context, LogLevel.warn, message);
  }
}
