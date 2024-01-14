import * as vscode from "vscode";
import { runCppOutputChannel } from "../output/runCppOutputChannel";
import { XmakeTestRunner } from "../cppTestRunners/xmakeTestRunner";

export const runTestCommandId = "coolextension.runtest";

// run test function with a string parameter for file path and a number parameter for line number:
async function runTest(filePath: string, lineNumber: number) {
    // Simply show a VS Code informational message with the parameters that were probvided:
    vscode.window.showInformationMessage(`Running test at ${filePath}:${lineNumber}`);
    runCppOutputChannel.appendLine(`Running test at ${filePath}:${lineNumber}`);
    runCppOutputChannel.show();

    // Let's actually run this and get a test result
    const testRunner = new XmakeTestRunner();
    const testResult = await testRunner.runTest(filePath, lineNumber);
    runCppOutputChannel.appendLine(`>> Test output: ${testResult.testOutput}`); // data.toString()}
    runCppOutputChannel.appendLine(`>> Test passed: ${testResult.testPassed}`);
}

export function registerTestCommand(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(runTestCommandId, runTest);
    context.subscriptions.push(disposable);
}
