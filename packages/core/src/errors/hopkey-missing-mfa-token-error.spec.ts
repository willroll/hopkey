import { describe, test, expect } from "@jest/globals";
import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";
import { HopkeyMissingMfaTokenError } from "./hopkey-missing-mfa-token-error";

describe("HopkeyMissingMfaTokenError", () => {
  test("validate existence and super parameters", () => {
    const error = new HopkeyMissingMfaTokenError(this, "mfa token error");

    expect(error).toBeInstanceOf(HopkeyMissingMfaTokenError);
    expect(error).toBeInstanceOf(HopkeyBaseError);
    expect(error.message).toBe("mfa token error");
    expect(error.name).toBe("Hopkey Missing Mfa Token Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});
