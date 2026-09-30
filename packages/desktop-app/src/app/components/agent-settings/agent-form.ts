import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AgentPermissions, AwsAgentSettings, agentConstants, agentPermissionsLabels } from "@hopkey/core/models/aws/aws-agent";

/**
 * The form controls that turn an IAM Role Chained session into the credentials of an AI agent.
 */
export const agentFormControls = (): { [name: string]: FormControl } => ({
  agentEnabled: new FormControl(false),
  agentName: new FormControl("", [Validators.pattern("[A-Za-z0-9][A-Za-z0-9_+=,.@-]{0,57}")]),
  agentPermissions: new FormControl(agentConstants.defaultPermissions),
  agentSessionPolicy: new FormControl(""),
  agentDuration: new FormControl(agentConstants.defaultDurationSeconds),
  agentSourceIdentity: new FormControl(false),
});

export const agentPermissionsOptions = Object.values(AgentPermissions).map((permissions) => ({
  value: permissions,
  label: agentPermissionsLabels[permissions],
}));

export const agentDurationOptions = [15, 30, 45, 60].map((minutes) => ({ value: minutes * 60, label: `${minutes} minutes` }));

export const setAgentForm = (form: FormGroup, agent?: AwsAgentSettings): void => {
  form.patchValue({
    agentEnabled: !!agent,
    agentName: agent?.name ?? "",
    agentPermissions: agent?.permissions ?? agentConstants.defaultPermissions,
    agentSessionPolicy: agent?.sessionPolicy ? JSON.stringify(JSON.parse(agent.sessionPolicy), null, 2) : "",
    agentDuration: agent?.durationSeconds ?? agentConstants.defaultDurationSeconds,
    agentSourceIdentity: !!agent?.setSourceIdentity,
  });
};

export const isAgentFormValid = (form: FormGroup): boolean => {
  if (!form.get("agentEnabled").value) {
    return true;
  }
  return (
    !!form.get("agentName").value &&
    form.get("agentName").valid &&
    (form.get("agentPermissions").value !== AgentPermissions.custom || !!form.get("agentSessionPolicy").value?.trim())
  );
};

/**
 * The agent settings in the form, checked by the core when the session is saved, or undefined for a regular session.
 */
export const agentSettingsFromForm = (form: FormGroup): AwsAgentSettings | undefined => {
  if (!form.get("agentEnabled").value) {
    return undefined;
  }
  const permissions = form.get("agentPermissions").value;
  return {
    name: form.get("agentName").value.trim(),
    permissions,
    sessionPolicy: permissions === AgentPermissions.custom ? form.get("agentSessionPolicy").value : undefined,
    durationSeconds: form.get("agentDuration").value,
    setSourceIdentity: !!form.get("agentSourceIdentity").value,
  };
};
