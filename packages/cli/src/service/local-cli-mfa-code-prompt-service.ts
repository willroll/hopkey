import { IMfaCodePrompter } from "@hopkey/core/interfaces/i-mfa-code-prompter";
import CliInquirer from "inquirer";

export class LocalCliMfaCodePromptService implements IMfaCodePrompter {
  constructor(private inquirer: CliInquirer.Inquirer) {}

  promptForMFACode(sessionName: string, callback: (code: string) => void): void {
    this.inquirer
      .prompt([
        {
          name: "mfaCode",
          message: `Insert MFA code for session ${sessionName}`,
          type: "input",
        },
      ])
      .then((mfaResponse: any) => callback(mfaResponse.mfaCode));
  }
}
