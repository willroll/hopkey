import { AnalyticsService } from "./analytics.service";

describe("AnalyticsService", () => {
  it("collects nothing", async () => {
    const service = new AnalyticsService();
    const fetchSpy = spyOn(window, "fetch");

    service.init({ userId: "user-id", email: "user@example.com" } as any);
    await service.captureEvent("Session Started", { sessionId: "session-id" }, true, true);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
