import { describe, test, expect } from "@jest/globals";
import { HopkeyBaseError } from "./hopkey-base-error";
import { LogLevel } from "../services/log-service";
import { HopkeyModalClosedError } from "./hopkey-modal-closed-error";

describe("HopkeyModalClosedError", () => {
  test("validate existence and super parameters", () => {
    const error = new HopkeyModalClosedError(this, "modal closed error");

    expect(error).toBeInstanceOf(HopkeyModalClosedError);
    expect(error).toBeInstanceOf(HopkeyBaseError);
    expect(error.message).toBe("modal closed error");
    expect(error.name).toBe("Hopkey Modal Closed");
    expect(error.severity).toBe(LogLevel.info);
    expect(error.context).toBe(this);
  });
});
