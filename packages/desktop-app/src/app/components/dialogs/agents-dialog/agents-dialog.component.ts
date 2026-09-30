import { Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { Subscription } from "rxjs";
import { AgentService, AgentSummary } from "@hopkey/core/services/agent-service";
import { AgentActivity } from "@hopkey/core/services/agent-activity-service";
import { AgentPermissions, agentPermissionsLabels } from "@hopkey/core/models/aws/aws-agent";
import { AppProviderService } from "../../../services/app-provider.service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { WindowService } from "../../../services/window.service";

@Component({
  selector: "app-agents-dialog",
  templateUrl: "./agents-dialog.component.html",
  styleUrls: ["./agents-dialog.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AgentsDialogComponent implements OnInit, OnDestroy {
  static readonly historyLength = 200;

  agents: AgentSummary[] = [];
  activities: AgentActivity[] = [];
  selectedAgent: string | null = null;
  toggling = new Set<string>();

  private agentService: AgentService;
  private sessionsSubscription: Subscription;

  constructor(
    private bsModalRef: BsModalRef,
    private appProviderService: AppProviderService,
    private messageToasterService: MessageToasterService,
    private windowService: WindowService
  ) {
    this.agentService = appProviderService.agentService;
  }

  ngOnInit(): void {
    // Agents are sessions: this also refreshes when the CLI or the session list enables or disables one
    this.sessionsSubscription = this.appProviderService.behaviouralSubjectService.sessions$.subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.sessionsSubscription?.unsubscribe();
  }

  refresh(): void {
    try {
      this.agents = this.agentService.listAgents();
      this.activities = this.agentService.history(this.selectedAgent ?? undefined, AgentsDialogComponent.historyLength);
    } catch (error) {
      this.messageToasterService.toast(`Hopkey could not read the agent activity: ${error.message}`, ToastLevel.error);
    }
  }

  selectAgent(agentName: string | null): void {
    this.selectedAgent = agentName;
    this.refresh();
  }

  async toggleAgent(agent: AgentSummary): Promise<void> {
    this.toggling.add(agent.name);
    try {
      if (agent.enabled) {
        await this.agentService.disable(agent.name);
      } else {
        await this.agentService.enable(agent.name);
      }
    } catch (error) {
      this.messageToasterService.toast(error.message, ToastLevel.error);
    } finally {
      this.toggling.delete(agent.name);
      this.refresh();
    }
  }

  permissionsLabel(permissions: string): string {
    return agentPermissionsLabels[permissions as AgentPermissions] ?? permissions;
  }

  requestedBy(activity: AgentActivity): string {
    return activity.requestedBy?.length ? activity.requestedBy.join(" ‹ ") : "";
  }

  roleName(roleArn: string): string {
    return roleArn?.split(":role/")[1] ?? roleArn;
  }

  openDocumentation(): void {
    this.windowService.openExternalUrl("https://willroll.github.io/hopkey/latest/configuring-session/ai-agents/");
  }

  close(): void {
    this.bsModalRef.hide();
  }
}
