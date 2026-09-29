import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";

export class HopkeyParseError extends HopkeyBaseError {
  constructor(context: any, message?: string) {
    super("Hopkey Parse Error", context, LogLevel.warn, message);
  }
}
