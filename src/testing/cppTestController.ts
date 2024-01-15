import * as vscode from "vscode";
import { runCppOutputChannel } from "../output/runCppOutputChannel";
import { XmakeTestRunner } from "../cppTestAdapters/xmakeTestAdapter";

export const cppTestController = vscode.tests.createTestController("cppTestController", "C++ Tests");

async function discoverTests(): Promise<void> {
    const xmakeTestRunner = new XmakeTestRunner();
    return new Promise((resolve, reject) => {
        xmakeTestRunner.discoverTests().then((tests) => {
            runCppOutputChannel.appendLine(`Discovered ${tests.length} tests`);
            tests.forEach((test) => {
                const id = `${test.filename}:${test.linenumber}`;
                const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, test.filename);
                const vscodeTest = cppTestController.createTestItem(
                    id,
                    test.description,
                    vscode.Uri.file(filePath.fsPath)
                );
                cppTestController.items.add(vscodeTest);
            });
            resolve();
        });
    });
}

cppTestController.resolveHandler = async (test) => {
    if (test) {
        runCppOutputChannel.appendLine(`ResolveHandler called for ${test.id}`);
    } else {
        runCppOutputChannel.appendLine("ResolveHandler called for the first time");
        discoverTests();
    }
};

cppTestController.refreshHandler = async () => {
    runCppOutputChannel.appendLine("RefreshHandler called");
    const xmakeTestRunner = new XmakeTestRunner();
    xmakeTestRunner.buildTestTarget().then(() => {
        discoverTests();
    });
};

export function registerCppTestController(context: vscode.ExtensionContext) {
    context.subscriptions.push(cppTestController);
}
