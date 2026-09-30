import { describe, expect, test } from "@jest/globals";
import { HopkeyNotification, HopkeyNotificationType } from "./notification";

describe("Notification Model", () => {
  test("should create", () => {
    const mockedNotification = new HopkeyNotification("fake-uuid", HopkeyNotificationType.info, "fake-title", "fake-description", false);
    expect(mockedNotification).toBeInstanceOf(HopkeyNotification);
    expect(mockedNotification).toBeTruthy();
    expect(mockedNotification.link).toBeUndefined();
    expect(mockedNotification.type).toEqual(HopkeyNotificationType.info);
  });
});
