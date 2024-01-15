import * as vscode from "vscode";
import { runCppOutputChannel } from "../output/runCppOutputChannel";
import { XmakeTestRunner } from "../cppTestAdapters/xmakeTestAdapter";
import { testResultDiagnosticCollection } from "../testResultDiagnostics/testResultDiagnostics";

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
                vscodeTest.range = new vscode.Range(
                    new vscode.Position(test.linenumber - 1, 0),
                    new vscode.Position(test.linenumber - 1, 0)
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
    cppTestController.items.forEach((test) => {
        cppTestController.items.delete(test.id);
    });
    const xmakeTestRunner = new XmakeTestRunner();
    xmakeTestRunner.buildTestTarget().then(() => {
        discoverTests();
    });
};

export function registerCppTestController(context: vscode.ExtensionContext) {
    context.subscriptions.push(cppTestController);
}

async function runHandler(shouldDebug: boolean, request: vscode.TestRunRequest, token: vscode.CancellationToken) {
    testResultDiagnosticCollection.clear();
    const xmakeTestRunner = new XmakeTestRunner();
    const run = cppTestController.createTestRun(request);
    run.appendOutput("Running tests...\n");

    await xmakeTestRunner.buildTestTarget();

    const testsToRun: vscode.TestItem[] = [];

    if (request.include)
        request.include.forEach((test) => {
            testsToRun.push(test);
        });
    else
        cppTestController.items.forEach((test) => {
            testsToRun.push(test);
        });

    runCppOutputChannel.appendLine(`Running ${testsToRun.length} tests`);
    run.appendOutput(`Running ${testsToRun.length} tests\n`);

    while (testsToRun.length > 0 && !token.isCancellationRequested) {
        const test = testsToRun.pop()!;

        if (request.exclude?.includes(test)) {
            runCppOutputChannel.appendLine(`Skipping ${test.id}`);
            continue;
        }

        runCppOutputChannel.appendLine(`Running ${test.id}`);

        const [filename, linenumber] = test.id.split(":");
        const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, filename);
        const editor = await vscode.window.showTextDocument(filePath);

        // Clear editor decorations
        // const decorationType = vscode.window.createTextEditorDecorationType({});
        // editor.setDecorations(decorationType, []);

        const start = Date.now();
        run.started(test);
        const testResult = await xmakeTestRunner.runTest(filename, parseInt(linenumber));
        const duration = Date.now() - start;
        if (testResult.testPassed) {
            runCppOutputChannel.appendLine(`Test ${test.id} passed`);
            run.appendOutput(testResult.testOutput);
            run.passed(test, duration);
        } else {
            runCppOutputChannel.appendLine(`Test ${test.id} failed`);
            run.appendOutput(testResult.testOutput);
            run.failed(test, new vscode.TestMessage(testResult.testOutput), duration);

            // Show the error message at the location of the test
            run.appendOutput(
                // testResult.testOutput,
                // The test output wrapped in ANSI code for red and then reset at the end:
                "\u001b[31m" + testResult.testOutput + "\u001b[0m",
                new vscode.Location(filePath, new vscode.Position(parseInt(linenumber) - 1, 0))
            );

            // Show the error message in the diagnostics pane
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(parseInt(linenumber) - 1, 0, parseInt(linenumber) - 1, 0),
                testResult.testOutput,
                vscode.DiagnosticSeverity.Error
            );
            testResultDiagnosticCollection.set(filePath, [diagnostic]);

            // Use decorations to show the error message in-line (font color: red)
            // const range = new vscode.Range(parseInt(linenumber + 1) - 1, 0, parseInt(linenumber + 1) - 1, 0);
            // const decoration = {
            //     range: range,
            //     renderOptions: {
            //         after: {
            //             contentText: testResult.testOutput.replace(/\n/g, " "),
            //             color: "red",
            //             fontWeight: "100",
            //         },
            //     },
            // };
            // const decorationType = vscode.window.createTextEditorDecorationType({});
            // editor.setDecorations(decorationType, [decoration]);
        }
    }

    runCppOutputChannel.appendLine("Finished running tests");
    run.appendOutput("Finished running tests\n");

    run.end();
}

const cppRunTestProfile = cppTestController.createRunProfile(
    "Run Tests",
    vscode.TestRunProfileKind.Run,
    (request, token) => {
        runHandler(false, request, token);
    },
    true
);
