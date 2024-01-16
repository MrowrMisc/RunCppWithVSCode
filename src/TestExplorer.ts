import * as vscode from "vscode";
import { discoverTests, buildTestsProject, runTest, debugTest } from "./TestManager";
import { ITestComponent, Test, TestComponentType, TestGroup } from "./TestTypes";
import { getSpecsConfig } from "./SpecsConfig";

const CONTROLLER_ID = "specs-explorer";
const CONTROLLER_LABEL = "Specs Explorer";

class TestExplorer {
    _controller: vscode.TestController;

    constructor() {
        this._controller = vscode.tests.createTestController(CONTROLLER_ID, CONTROLLER_LABEL);
        this._controller.refreshHandler = this.refresh.bind(this);
        this._controller.resolveHandler = async (test) => {
            if (test) vscode.window.showErrorMessage("Resolving individual tests is not supported");
            else await this.refresh();
        };
        this._controller.createRunProfile("Run", vscode.TestRunProfileKind.Run, this.run.bind(this), true);
        getSpecsConfig().then((config) => {
            if (config?.anySuitesSupportDebug())
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

    private registerTestComponent(
        discoveredIds: Set<string>,
        testComponent: ITestComponent,
        parentTestItem?: vscode.TestItem,
    ) {
        if (testComponent.type === TestComponentType.Test) {
            const test = testComponent as Test;
            const id = `${test.suiteId}|~|~|~|~|${test.filePath}|-|-|-|${test.lineNumber}`;
            discoveredIds.add(id);
            const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, test.filePath);
            const vscodeTest = this._controller.createTestItem(id, test.description, vscode.Uri.file(filePath.fsPath));
            vscodeTest.range = new vscode.Range(
                new vscode.Position(test.lineNumber - 1, 0),
                new vscode.Position(test.lineNumber - 1, 0),
            );
            if (parentTestItem) parentTestItem.children.add(vscodeTest);
            else this._controller.items.add(vscodeTest);
        } else if (testComponent.type === TestComponentType.TestGroup) {
            const testGroup = testComponent as TestGroup;
            if (testGroup.description === "") {
                testGroup.children.forEach((child) => {
                    this.registerTestComponent(discoveredIds, child, parentTestItem);
                });
            } else {
                const id = `group: ${testGroup.fullDescription()}|${testGroup.suiteId}}`;
                discoveredIds.add(id);
                const vscodeTestGroup = this._controller.createTestItem(id, testGroup.description);
                if (parentTestItem) parentTestItem.children.add(vscodeTestGroup);
                else this._controller.items.add(vscodeTestGroup);
                testGroup.children.forEach((child) => {
                    this.registerTestComponent(discoveredIds, child, vscodeTestGroup);
                });
            }
        }
    }

    async refresh() {
        const existingTestIds = new Set<string>();
        this._controller.items.forEach((test) => {
            existingTestIds.add(test.id);
        });

        const discoveredTestComponents = await discoverTests();
        if (!discoveredTestComponents) {
            vscode.window.showErrorMessage("Failed to discover tests");
            this._controller.items.forEach((test) => {
                this._controller.items.delete(test.id);
            });
            return;
        }

        const discoveredIds = new Set<string>();

        discoveredTestComponents.forEach((testComponent) => {
            this.registerTestComponent(discoveredIds, testComponent);
        });

        existingTestIds.forEach((id) => {
            if (!discoveredIds.has(id)) this._controller.items.delete(id);
        });
    }

    addTestsToRun(test: vscode.TestItem, testsToRun: vscode.TestItem[]) {
        testsToRun.push(test);
        test.children.forEach((child) => {
            this.addTestsToRun(child, testsToRun);
        });
    }

    async run(request: vscode.TestRunRequest, token: vscode.CancellationToken) {
        await buildTestsProject();

        const run = this._controller.createTestRun(request);
        const testsToRun: vscode.TestItem[] = [];

        if (request.include)
            request.include.forEach((test) => {
                this.addTestsToRun(test, testsToRun);
            });
        else
            this._controller.items.forEach((test) => {
                this.addTestsToRun(test, testsToRun);
            });

        run.appendOutput(`Running ${testsToRun.length} tests\n`);

        while (testsToRun.length > 0 && !token.isCancellationRequested) {
            const test = testsToRun.pop()!;

            if (request.exclude?.includes(test)) continue;

            if (test.id.startsWith("group:")) continue; // or mark passed?

            const [suiteId, filenameAndLineNumber] = test.id.split("|~|~|~|~|");
            const [filename, linenumber] = filenameAndLineNumber.split("|-|-|-|");

            const start = Date.now();
            run.started(test);
            const testResult = await runTest(suiteId, filename, parseInt(linenumber));
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
        // TODO: a test can have metadata, right? Instead of this INSANITY?
        const [suiteId, filenameAndLineNumber] = test.id.split("|~|~|~|~|");
        const [filename, linenumber] = filenameAndLineNumber.split("|-|-|-|");

        await buildTestsProject();
        await debugTest(suiteId, filename, parseInt(linenumber));
    }
}

const testExplorer = new TestExplorer();

export function RegisterSpecsTestExtension(context: vscode.ExtensionContext) {
    testExplorer.registerController(context);
}
