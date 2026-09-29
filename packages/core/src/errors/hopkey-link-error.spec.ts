import { describe, test, expect } from "@jest/globals";
import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";
import { HopkeyLinkError } from "./hopkey-link-error";

describe("HopkeyLinkError", () => {
  test("validate existence and super parameters", () => {
    const error = new HopkeyLinkError("", this, "link error");

    expect(error).toBeInstanceOf(HopkeyLinkError);
    expect(error).toBeInstanceOf(HopkeyBaseError);
    expect(error.message).toBe("link error");
    expect(error.name).toBe("Error");
    expect(error.severity).toBe(LogLevel.error);
    expect(error.context).toBe(this);
  });
});
