import { describe, test, expect } from "@jest/globals";
import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";
import { HopkeyParseError } from "./hopkey-parse-error";

describe("HopkeyParseError", () => {
  test("validate existence and super parameters", () => {
    const error = new HopkeyParseError(this, "parse error");

    expect(error).toBeInstanceOf(HopkeyParseError);
    expect(error).toBeInstanceOf(HopkeyBaseError);
    expect(error.message).toBe("parse error");
    expect(error.name).toBe("Hopkey Parse Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});
