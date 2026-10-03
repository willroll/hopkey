import { Pipe, PipeTransform } from "@angular/core";
import { Session } from "@hopkey/core/models/session";
import { SessionStatus } from "@hopkey/core/models/session-status";

@Pipe({
  name: "filtering",
  standalone: false,
})
export class FilteringPipe implements PipeTransform {
  transform(sessions: Session[], activeOrPending: boolean): Session[] {
    return sessions.filter((session) =>
      activeOrPending
        ? session.status === SessionStatus.active || session.status === SessionStatus.pending
        : session.status === SessionStatus.inactive
    );
  }
}
