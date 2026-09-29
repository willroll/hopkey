import { describe, test, expect } from "@jest/globals";
import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";
import { HopkeyNotFoundError } from "./hopkey-not-found-error";

describe("HopkeyNotFoundError", () => {
  test("validate existence and super parameters", () => {
    const error = new HopkeyNotFoundError(this, "not found error");

    expect(error).toBeInstanceOf(HopkeyNotFoundError);
    expect(error).toBeInstanceOf(HopkeyBaseError);
    expect(error.message).toBe("not found error");
    expect(error.name).toBe("Hopkey Not Found Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});
