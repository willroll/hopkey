import * as uuid from "uuid";
import { SessionStatus } from "./session-status";
import { SessionType } from "./session-type";
import { constants } from "./constants";

/**
 * This class contains metadata that represents a Hopkey Session;
 * it has a concrete implementation for each specific Hopkey Session type.
 * It implements an expired method used to tell whether the Session needs to be rotated or not.
 * In addition, this object is persisted in the Hopkey configuration file (hopkey-lock.json).
 */
export class Session {
  sessionId: string;
  status: SessionStatus;
  startDateTime?: string;
  type: SessionType;
  sessionTokenExpiration: string;

  constructor(public sessionName: string, public region: string) {
    this.sessionId = uuid.v4();
    this.status = SessionStatus.inactive;
    this.startDateTime = undefined;
  }

  expired(): boolean {
    if (this.startDateTime === undefined) {
      return false;
    }
    const currentTime = new Date().getTime();
    const startTime = new Date(this.startDateTime).getTime();
    return (currentTime - startTime) / 1000 > constants.sessionDuration;
  }
}
