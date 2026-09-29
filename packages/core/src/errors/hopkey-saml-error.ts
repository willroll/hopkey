import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";

export class HopkeySamlError extends HopkeyBaseError {
  constructor(context: any, message?: string) {
    super("Hopkey Saml Error", context, LogLevel.warn, message);
  }
}
