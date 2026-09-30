import { Injectable } from "@angular/core";
import { User } from "./team-service";

/**
 * Hopkey does not collect usage analytics: these hooks are kept as no-ops so that the existing call
 * sites keep compiling, and so an opt-in analytics backend could be plugged in here later.
 */
@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  init(_user: User): void {
    // Intentionally empty: no analytics are collected.
  }

  async captureEvent(_eventName: string, _properties: any = {}, _captureAnonymousEvent = false, _resetAfterCapture = false): Promise<void> {
    // Intentionally empty: no analytics are collected.
  }
}
