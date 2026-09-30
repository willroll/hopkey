import { FormGroup } from "@angular/forms";
import { AgentPermissions } from "@hopkey/core/models/aws/aws-agent";
import { agentDurationOptions, agentFormControls, agentSettingsFromForm, isAgentFormValid, setAgentForm } from "./agent-form";

describe("agent-form", () => {
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup(agentFormControls());
  });

  it("describes a regular session until the agent box is ticked", () => {
    expect(isAgentFormValid(form)).toBe(true);
    expect(agentSettingsFromForm(form)).toBeUndefined();
  });

  it("needs a valid agent name", () => {
    form.patchValue({ agentEnabled: true });
    expect(isAgentFormValid(form)).toBe(false);
    form.patchValue({ agentName: "bad name" });
    expect(isAgentFormValid(form)).toBe(false);
    form.patchValue({ agentName: "claude" });
    expect(isAgentFormValid(form)).toBe(true);
  });

  it("needs a session policy for custom permissions", () => {
    form.patchValue({ agentEnabled: true, agentName: "claude", agentPermissions: AgentPermissions.custom });
    expect(isAgentFormValid(form)).toBe(false);
    form.patchValue({ agentSessionPolicy: '{"Statement": []}' });
    expect(isAgentFormValid(form)).toBe(true);
  });

  it("reads the agent settings, dropping the policy of non-custom permissions", () => {
    form.patchValue({ agentEnabled: true, agentName: " claude ", agentSessionPolicy: "{}", agentDuration: 1800, agentSourceIdentity: true });
    expect(agentSettingsFromForm(form)).toEqual({
      name: "claude",
      permissions: AgentPermissions.readOnly,
      sessionPolicy: undefined,
      durationSeconds: 1800,
      setSourceIdentity: true,
    });
  });

  it("fills the form from saved agent settings", () => {
    setAgentForm(form, {
      name: "claude",
      permissions: AgentPermissions.custom,
      sessionPolicy: '{"Statement":[]}',
      durationSeconds: 3600,
      setSourceIdentity: false,
    });
    expect(form.value).toEqual({
      agentEnabled: true,
      agentName: "claude",
      agentPermissions: AgentPermissions.custom,
      agentSessionPolicy: '{\n  "Statement": []\n}',
      agentDuration: 3600,
      agentSourceIdentity: false,
    });

    setAgentForm(form, undefined);
    expect(form.value.agentEnabled).toBe(false);
    expect(agentSettingsFromForm(form)).toBeUndefined();
  });

  it("offers durations from 15 to 60 minutes", () => {
    expect(agentDurationOptions.map((option) => option.value)).toEqual([900, 1800, 2700, 3600]);
  });
});
