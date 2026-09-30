import { BehaviorSubject } from "rxjs";
import { AgentsDialogComponent } from "./agents-dialog.component";
import { AgentPermissions } from "@hopkey/core/models/aws/aws-agent";
import { ToastLevel } from "../../../services/message-toaster.service";

describe("AgentsDialogComponent", () => {
  let agentService: any;
  let sessions$: BehaviorSubject<any[]>;
  let bsModalRef: any;
  let messageToasterService: any;
  let windowService: any;
  let component: AgentsDialogComponent;
  const agent = {
    sessionId: "agent1",
    name: "claude",
    enabled: false,
    profileName: "agent-claude",
    roleArn: "arn:aws:iam::123456789012:role/agents/claude",
    parentSessionName: "me",
    permissions: AgentPermissions.readOnly,
    durationSeconds: 900,
    setSourceIdentity: false,
  };

  beforeEach(() => {
    agentService = jasmine.createSpyObj("AgentService", ["listAgents", "history", "enable", "disable"]);
    agentService.listAgents.and.returnValue([agent]);
    agentService.history.and.returnValue([{ event: "credentials", agent: "claude", requestedBy: ["aws", "bash", "claude"] }]);
    agentService.enable.and.returnValue(Promise.resolve());
    agentService.disable.and.returnValue(Promise.resolve());
    sessions$ = new BehaviorSubject([]);
    bsModalRef = jasmine.createSpyObj("BsModalRef", ["hide"]);
    messageToasterService = jasmine.createSpyObj("MessageToasterService", ["toast"]);
    windowService = jasmine.createSpyObj("WindowService", ["openExternalUrl"]);
    const appProviderService: any = { agentService, behaviouralSubjectService: { sessions$ } };
    component = new AgentsDialogComponent(bsModalRef, appProviderService, messageToasterService, windowService);
  });

  it("lists the agents and their activity, and refreshes when the sessions change", () => {
    component.ngOnInit();
    expect(component.agents).toEqual([agent]);
    expect(agentService.history).toHaveBeenCalledWith(undefined, AgentsDialogComponent.historyLength);

    sessions$.next([]);
    expect(agentService.listAgents).toHaveBeenCalledTimes(2);

    component.ngOnDestroy();
    sessions$.next([]);
    expect(agentService.listAgents).toHaveBeenCalledTimes(2);
  });

  it("filters the activity by agent", () => {
    component.selectAgent("claude");
    expect(agentService.history).toHaveBeenCalledWith("claude", AgentsDialogComponent.historyLength);
    component.selectAgent(null);
    expect(agentService.history).toHaveBeenCalledWith(undefined, AgentsDialogComponent.historyLength);
  });

  it("enables and disables an agent", async () => {
    await component.toggleAgent({ ...agent, enabled: false });
    expect(agentService.enable).toHaveBeenCalledWith("claude");
    await component.toggleAgent({ ...agent, enabled: true });
    expect(agentService.disable).toHaveBeenCalledWith("claude");
    expect(component.toggling.size).toBe(0);
  });

  it("reports a failure to enable an agent", async () => {
    agentService.enable.and.returnValue(Promise.reject(new Error("An agent needs a named profile of its own")));
    await component.toggleAgent(agent);
    expect(messageToasterService.toast).toHaveBeenCalledWith("An agent needs a named profile of its own", ToastLevel.error);
    expect(component.toggling.size).toBe(0);
  });

  it("reports an activity file it can't read", () => {
    agentService.history.and.throwError("EACCES");
    component.refresh();
    expect(messageToasterService.toast).toHaveBeenCalledWith("Hopkey could not read the agent activity: EACCES", ToastLevel.error);
  });

  it("formats the activity", () => {
    expect(component.requestedBy({ requestedBy: ["aws", "bash", "claude"] } as any)).toBe("aws ‹ bash ‹ claude");
    expect(component.requestedBy({} as any)).toBe("");
    expect(component.roleName("arn:aws:iam::123456789012:role/agents/claude")).toBe("agents/claude");
    expect(component.permissionsLabel(AgentPermissions.viewOnly)).toBe("View-only");
    expect(component.permissionsLabel("something-new")).toBe("something-new");
  });

  it("opens the documentation and closes", () => {
    component.openDocumentation();
    expect(windowService.openExternalUrl).toHaveBeenCalledWith("https://willroll.github.io/hopkey/latest/configuring-session/ai-agents/");
    component.close();
    expect(bsModalRef.hide).toHaveBeenCalled();
  });
});
