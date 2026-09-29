import { describe, test, expect } from "@jest/globals";
import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";
import { HopkeySamlError } from "./hopkey-saml-error";

describe("HopkeySamlError", () => {
  test("validate existence and super parameters", () => {
    const error = new HopkeySamlError(this, "saml error");

    expect(error).toBeInstanceOf(HopkeySamlError);
    expect(error).toBeInstanceOf(HopkeyBaseError);
    expect(error.message).toBe("saml error");
    expect(error.name).toBe("Hopkey Saml Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});
