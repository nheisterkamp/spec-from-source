import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "spec-from-source.createSpec",
    async () => {
      const fileName = vscode.window.activeTextEditor?.document.fileName;
      if (!fileName || !fileName.includes("/")) {
        vscode.window.showWarningMessage("No file open or not saved yet");
        return;
      }
      if (!fileName.toLowerCase().endsWith(".ts")) {
        vscode.window.showWarningMessage("File needs to be TS");
        return;
      }
      if (fileName.toLowerCase().endsWith(".spec.ts")) {
        vscode.window.showWarningMessage("File already spec");
        return;
      }

      const out = fileName.replace(/(.*)(\.ts)$/i, "$1.spec$2");

      try {
        await fs.promises.stat(out);
        vscode.window.showErrorMessage(`Spec already exists`);

        try {
          const doc = await vscode.workspace.openTextDocument(out);
          await vscode.window.showTextDocument(doc);
        } catch (e) {
          console.error(e);
          if (e instanceof Error) {
            vscode.window.showErrorMessage(`Error during open: ${e.message}`);
          }

          return;
        }

        return;
      } catch (e) {}

      const content = await fs.promises.readFile(fileName, "utf-8");
      const matches = /export const ([^\s]+)/g.exec(content);

      if (!matches || matches.length === 0) {
        vscode.window.showWarningMessage("Could not find exported function");
        return;
      }

      const functionName = matches[1];

      vscode.window.showInformationMessage(
        `Creating ${out} for ${functionName}`
      );

      const data = `import { ${functionName} } from "./${path
        .basename(fileName)
        .replace(/\.ts$/i, "")}";

describe("${functionName}", () => {
    it("should not catch fire", () => {
        expect(${functionName}).toBeDefined;
    });
});
`;

      console.log({ out, data });

      try {
        await fs.promises.writeFile(out, data, "utf-8");
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          vscode.window.showErrorMessage(`Error in write: ${e.message}`);
        }

        return;
      }

      try {
        const doc = await vscode.workspace.openTextDocument(out);
        await vscode.window.showTextDocument(doc);
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          vscode.window.showErrorMessage(`Error during open: ${e.message}`);
        }

        return;
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
