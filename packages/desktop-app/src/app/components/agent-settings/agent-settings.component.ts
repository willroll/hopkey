import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AgentPermissions } from "@hopkey/core/models/aws/aws-agent";
import { agentDurationOptions, agentPermissionsOptions } from "./agent-form";

/**
 * The AI agent section of the IAM Role Chained session dialogs, bound to the controls of agentFormControls().
 */
@Component({
  selector: "app-agent-settings",
  templateUrl: "./agent-settings.component.html",
  styleUrls: ["./agent-settings.component.scss"],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AgentSettingsComponent {
  @Input() form: FormGroup;

  eAgentPermissions = AgentPermissions;
  permissionsOptions = agentPermissionsOptions;
  durationOptions = agentDurationOptions;

  get agentEnabled(): boolean {
    return !!this.form.get("agentEnabled").value;
  }

  get agentName(): string {
    return this.form.get("agentName").value?.trim() || "<name>";
  }
}
