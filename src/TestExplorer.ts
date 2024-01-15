import * as vscode from "vscode";
import { discoverTests, buildTestsProject, runTest, debugTest } from "./TestRunner";
import { getSpecsConfig } from "./SpecsConfig";

const CONTROLLER_ID = "this._controller";
const CONTROLLER_LABEL = "C++ Tests";

class TestExplorer {
    _controller: vscode.TestController;

    constructor() {
        this._controller = vscode.tests.createTestController(CONTROLLER_ID, CONTROLLER_LABEL);
        this._controller.refreshHandler = this.refresh.bind(this);
        this._controller.resolveHandler = async (test) => {
            if (test) vscode.window.showErrorMessage("Resolving individual tests is not supported");
            else await this.refresh();
        };
        this._controller.createRunProfile(
            "Run",
            vscode.TestRunProfileKind.Run,
            this.run.bind(this),
            true,
        );
        getSpecsConfig().then((config) => {
            if (config?.debugCommand)
                this._controller.createRunProfile(
                    "Debug",
                    vscode.TestRunProfileKind.Debug,
                    this.debug.bind(this),
                    true,
                );
        });
    }

    registerController(context: vscode.ExtensionContext) {
        context.subscriptions.push(this._controller);
    }

    async refresh() {
        const existingTestIds = new Set<string>();
        this._controller.items.forEach((test) => {
            existingTestIds.add(test.id);
        });

        const tests = await discoverTests();
        if (!tests) {
            vscode.window.showErrorMessage("Failed to discover tests");
            this._controller.items.forEach((test) => {
                this._controller.items.delete(test.id);
            });
            return;
        }

        const discoveredTestIds = new Set<string>();
        tests.forEach((test) => {
            const id = `${test.filename}:${test.linenumber}`;
            discoveredTestIds.add(id);
            const filePath = vscode.Uri.joinPath(
                vscode.workspace.workspaceFolders![0].uri,
                test.filename,
            );
            const vscodeTest = this._controller.createTestItem(
                id,
                test.description,
                vscode.Uri.file(filePath.fsPath),
            );
            vscodeTest.range = new vscode.Range(
                new vscode.Position(test.linenumber - 1, 0),
                new vscode.Position(test.linenumber - 1, 0),
            );
            this._controller.items.add(vscodeTest);
        });

        existingTestIds.forEach((id) => {
            if (!discoveredTestIds.has(id)) this._controller.items.delete(id);
        });
    }

    async run(request: vscode.TestRunRequest, token: vscode.CancellationToken) {
        await buildTestsProject();

        const run = this._controller.createTestRun(request);
        const testsToRun: vscode.TestItem[] = [];

        if (request.include)
            request.include.forEach((test) => {
                testsToRun.push(test);
            });
        else
            this._controller.items.forEach((test) => {
                testsToRun.push(test);
            });

        run.appendOutput(`Running ${testsToRun.length} tests\n`);

        while (testsToRun.length > 0 && !token.isCancellationRequested) {
            const test = testsToRun.pop()!;

            if (request.exclude?.includes(test)) continue;

            const [filename, linenumber] = test.id.split(":");

            const start = Date.now();
            run.started(test);
            const testResult = await runTest(filename, parseInt(linenumber));
            if (!testResult) continue;

            const duration = Date.now() - start;
            if (testResult.testPassed) run.passed(test, duration);
            else run.failed(test, new vscode.TestMessage(testResult.testOutput), duration);
        }
        run.end();
    }

    async debug(request: vscode.TestRunRequest, token: vscode.CancellationToken) {
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
    }
}

const testExplorer = new TestExplorer();

export function RegisterSpecsTestExtension(context: vscode.ExtensionContext) {
    testExplorer.registerController(context);
}
