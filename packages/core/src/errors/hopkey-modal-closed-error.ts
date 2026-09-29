import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";

export class HopkeyModalClosedError extends HopkeyBaseError {
  constructor(context: any, message?: string) {
    super("Hopkey Modal Closed", context, LogLevel.info, message);
  }
}
