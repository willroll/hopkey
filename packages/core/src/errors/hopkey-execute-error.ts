import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";

export class HopkeyExecuteError extends HopkeyBaseError {
  constructor(context: any, message?: string) {
    super("Hopkey Execute Error", context, LogLevel.warn, message);
  }
}
