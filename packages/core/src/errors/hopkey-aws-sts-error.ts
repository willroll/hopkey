import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";

export class HopkeyAwsStsError extends HopkeyBaseError {
  constructor(context: any, message?: string) {
    super("Hopkey Aws Sts Error", context, LogLevel.warn, message);
  }
}
