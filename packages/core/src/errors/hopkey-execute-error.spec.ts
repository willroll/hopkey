import { describe, test, expect } from "@jest/globals";
import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";
import { HopkeyExecuteError } from "./hopkey-execute-error";

describe("HopkeyExecuteError", () => {
  test("validate existence and super parameters", () => {
    const error = new HopkeyExecuteError(this, "exec error");

    expect(error).toBeInstanceOf(HopkeyExecuteError);
    expect(error).toBeInstanceOf(HopkeyBaseError);
    expect(error.message).toBe("exec error");
    expect(error.name).toBe("Hopkey Execute Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});
