import * as vscode from "vscode";
import { runCppOutputChannel } from "./runCppOutputChannel";
import { discoverTests, buildTestsProject, runTest, debugTest } from "./testRunner";
import { get } from "node:http";
import { getSpecsConfig } from "./specsConfigFile";

const cppTestController = vscode.tests.createTestController("cppTestController", "C++ Tests");

export function registerCppTestController(context: vscode.ExtensionContext) {
    context.subscriptions.push(cppTestController);
}

async function discover(): Promise<void> {
    const existingTestIds = new Set<string>();
    cppTestController.items.forEach((test) => {
        existingTestIds.add(test.id);
    });

    const tests = await discoverTests();
    if (!tests) {
        vscode.window.showErrorMessage("Failed to discover tests");
        cppTestController.items.forEach((test) => {
            cppTestController.items.delete(test.id);
        });
        return;
    }

    runCppOutputChannel.appendLine(`Discovered ${tests.length} tests`);

    const discoveredTestIds = new Set<string>();
    tests.forEach((test) => {
        const id = `${test.filename}:${test.linenumber}`;
        discoveredTestIds.add(id);
        const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, test.filename);
        const vscodeTest = cppTestController.createTestItem(id, test.description, vscode.Uri.file(filePath.fsPath));
        vscodeTest.range = new vscode.Range(
            new vscode.Position(test.linenumber - 1, 0),
            new vscode.Position(test.linenumber - 1, 0)
        );
        cppTestController.items.add(vscodeTest);
    });

    existingTestIds.forEach((id) => {
        if (!discoveredTestIds.has(id)) cppTestController.items.delete(id);
    });
}

cppTestController.resolveHandler = async (test) => {
    if (test) {
        runCppOutputChannel.appendLine(`ResolveHandler called for ${test.id}`);
    } else {
        runCppOutputChannel.appendLine("ResolveHandler called for the first time");
        await discover();
    }
};

cppTestController.refreshHandler = async () => {
    await buildTestsProject();
    await discover();
};

async function runHandler(debug: boolean, request: vscode.TestRunRequest, token: vscode.CancellationToken) {
    if (debug) {
        const debugAll = request.include === undefined;
        if (debugAll) {
            vscode.window.showErrorMessage("Debug all tests is not supported");
            return;
        }

        if (request.include.length > 1) {
            vscode.window.showErrorMessage("Debugging multiple tests is not supported");
            return;
        }

        const test = request.include[0];
        const [filename, linenumber] = test.id.split(":");

        await buildTestsProject();
        await debugTest(filename, parseInt(linenumber));

        return;
    }

    const run = cppTestController.createTestRun(request);

    await buildTestsProject();

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
        // const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, filename);

        const start = Date.now();
        run.started(test);
        const testResult = await runTest(filename, parseInt(linenumber), debug);
        if (!testResult) continue;

        const duration = Date.now() - start;
        if (testResult.testPassed) {
            runCppOutputChannel.appendLine(`Test ${test.id} passed`);
            run.appendOutput(testResult.testOutput);
            run.passed(test, duration);
        } else {
            runCppOutputChannel.appendLine(`Test ${test.id} failed`);
            run.appendOutput(testResult.testOutput);
            run.failed(test, new vscode.TestMessage(testResult.testOutput), duration);
        }
    }
    run.end();
}

cppTestController.createRunProfile(
    "Run",
    vscode.TestRunProfileKind.Run,
    (request, token) => {
        runHandler(false, request, token);
    },
    true
);

getSpecsConfig().then((config) => {
    if (config?.debugCommand)
        cppTestController.createRunProfile(
            "Debug",
            vscode.TestRunProfileKind.Debug,
            (request, token) => {
                runHandler(true, request, token);
            },
            true
        );
});
