import { describe, test, expect } from "@jest/globals";
import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";
import { HopkeyNotAwsAccountError } from "./hopkey-not-aws-account-error";

describe("HopkeyNotAwsAccountError", () => {
  test("validate existence and super parameters", () => {
    const error = new HopkeyNotAwsAccountError(this, "not aws error");

    expect(error).toBeInstanceOf(HopkeyNotAwsAccountError);
    expect(error).toBeInstanceOf(HopkeyBaseError);
    expect(error.message).toBe("not aws error");
    expect(error.name).toBe("Hopkey Not aws Account Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});
