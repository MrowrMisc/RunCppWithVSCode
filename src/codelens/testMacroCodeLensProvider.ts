import * as vscode from "vscode";
import { runTestCommandId } from "../commands/runTestCommand";

class TestCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = [];
        const regex = /^Test\("[^"]*"\)/;

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            if (line.text.match(regex)) {
                const range = new vscode.Range(i, 0, i, 0);
                const filepath = vscode.workspace.asRelativePath(document.uri.fsPath);
                const linenumber = i + 1;
                const command: vscode.Command = {
                    title: "Run Test",
                    command: runTestCommandId,
                    arguments: [filepath, linenumber],
                };
                lenses.push(new vscode.CodeLens(range, command));
            }
        }

        return lenses;
    }
}

export function registerTestCodeLens(context: vscode.ExtensionContext) {
    const provider = new TestCodeLensProvider();
    context.subscriptions.push(vscode.languages.registerCodeLensProvider("cpp", provider));
}
