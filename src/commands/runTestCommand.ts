import * as vscode from "vscode";

export const runTestCommandId = "coolextension.runtest";

// run test function with a string parameter for file path and a number parameter for line number:
function runTest(filePath: string, lineNumber: number) {
    // Simply show a VS Code informational message with the parameters that were probvided:
    vscode.window.showInformationMessage(`Running test at ${filePath}:${lineNumber}`);
}

export function registerTestCommand(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(runTestCommandId, runTest);
    context.subscriptions.push(disposable);
}
