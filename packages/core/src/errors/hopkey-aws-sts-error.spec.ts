import { describe, test, expect } from "@jest/globals";
import { HopkeyAwsStsError } from "./hopkey-aws-sts-error";
import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";

describe("HopkeyAwsStsError", () => {
  test("validate existence and super parameters", () => {
    const error = new HopkeyAwsStsError(this, "sts error");

    expect(error).toBeInstanceOf(HopkeyAwsStsError);
    expect(error).toBeInstanceOf(HopkeyBaseError);
    expect(error.message).toBe("sts error");
    expect(error.name).toBe("Hopkey Aws Sts Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});
