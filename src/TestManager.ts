import * as vscode from "vscode";
import * as child_process from "child_process";
import { getSpecsConfig, SpecsConfigFile, SpecsSuiteConfig } from "./SpecsConfig";
import { ITestComponent, Test, TestGroup, TestResult } from "./TestTypes";

class TestManager {
    async buildSuite(specsSuiteConfig: SpecsSuiteConfig): Promise<void> {
        if (specsSuiteConfig.isGroup) return;
        if (specsSuiteConfig.buildCommand) {
            const command = specsSuiteConfig.buildCommand;
            const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
            return new Promise((resolve) => {
                const child = child_process.exec(command, options);
                child.stdout?.on("data", (data) => {
                    console.log(data);
                });
                child.stderr?.on("data", (data) => {
                    console.log(data);
                });
                child.on("close", (code) => {
                    resolve();
                });
            });
        }
    }

    public async build(suiteIds: string[] | undefined = undefined): Promise<void> {
        const specsConfig = await getSpecsConfig();
        if (!specsConfig?.suites.length) {
            vscode.window.showErrorMessage("No suites specified in specs.json");
            return;
        }

        if (!suiteIds) suiteIds = Array.from(specsConfig.suitesById.keys());
        if (!suiteIds.length) return;

        const promises: Promise<void>[] = [];
        suiteIds.forEach((suiteId) => {
            const suiteConfig = specsConfig?.suitesById.get(suiteId);
            if (!suiteConfig?.isGroup) {
                if (suiteConfig?.buildCommand) promises.push(this.buildSuite(suiteConfig));
            }
        });
        return Promise.all(promises).then(() => {});
    }

    public async run(suiteId: string, filePath: string, lineNumber: number): Promise<TestResult | undefined> {
        const specsConfig = await getSpecsConfig();
        const suiteConfig = specsConfig?.suitesById.get(suiteId);
        if (suiteConfig?.isGroup) return;
        if (!suiteConfig) {
            vscode.window.showErrorMessage(`Suite '${suiteId}' not found in specs.json`);
            return;
        }
        if (!suiteConfig?.runCommand) {
            vscode.window.showErrorMessage("No run command specified in specs.json");
            return;
        }

        let testResult: TestResult = new TestResult();

        const command = `${suiteConfig.runCommand} "${filePath}" "${lineNumber}"`;

        return new Promise((resolve) => {
            const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
            const child = child_process.exec(command, options, (error) => {
                if (error) testResult.testPassed = false;
            });
            child.stdout?.on("data", (data) => {
                testResult.testOutput += data;
            });
            child.stderr?.on("data", (data) => {
                testResult.testOutput += data;
            });
            child.on("close", (code) => {
                testResult.testPassed = code === 0;
                resolve(testResult);
            });
        });
    }

    public async debug(suiteId: string, filePath: string, lineNumber: number) {
        const specsConfig = await getSpecsConfig();
        const suiteConfig = specsConfig?.suitesById.get(suiteId);

        if (!suiteConfig?.debugExecutable) {
            vscode.window.showErrorMessage("No debug command specified in specs.json");
            return;
        }

        vscode.debug.startDebugging(vscode.workspace.workspaceFolders?.[0], {
            name: "Debug Test",
            type: "cppvsdbg",
            request: "launch",
            program: suiteConfig.debugExecutable,
            args: [filePath, lineNumber.toString()],
            cwd: "${workspaceFolder}",
            environment: [],
        });
    }

    public async discoverSuite(suiteId: string): Promise<ITestComponent[] | undefined> {
        const specsConfig = await getSpecsConfig();
        const suiteConfig = specsConfig?.suitesById.get(suiteId);
        if (!suiteConfig) {
            vscode.window.showErrorMessage(`Suite '${suiteId}' not found in specs.json`);
            return;
        }
        if (suiteConfig?.isGroup) return;
        if (!suiteConfig?.discoveryCommand) {
            vscode.window.showErrorMessage("No discovery command specified in specs.json");
            return;
        }

        const command = suiteConfig.discoveryCommand;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };

        return new Promise((resolve, reject) => {
            const child = child_process.exec(command, options, (error) => {
                if (error) reject(error);
            });
            child.stdout?.on("data", (data) => {
                const rootTestGroup = new TestGroup(suiteId, suiteConfig.name);
                const lines = data.split("\n");
                for (const line of lines) this.parseTestLine(line, suiteConfig!, rootTestGroup);
                if (suiteConfig.name === "") resolve(rootTestGroup.children);
                else resolve([rootTestGroup]);
            });
        });
    }

    public async discover(suiteIds: string[] | undefined = undefined): Promise<ITestComponent[] | undefined> {
        const specsConfig = await getSpecsConfig();
        if (!specsConfig?.suites.length) {
            vscode.window.showErrorMessage("No suites specified in specs.json");
            return;
        }

        if (!suiteIds) suiteIds = Array.from(specsConfig.suitesById.keys());
        if (!suiteIds.length) return;

        const promises: Promise<ITestComponent[] | undefined>[] = [];
        suiteIds.forEach((suiteId) => {
            const suiteConfig = specsConfig?.suitesById.get(suiteId);
            if (suiteConfig?.discoveryCommand) promises.push(this.discoverSuite(suiteConfig.idenfifier()));
        });
        return Promise.all(promises).then((results) => {
            const rootTestGroup = new TestGroup();
            results.forEach((result) => {
                if (result) rootTestGroup.children.push(...result);
            });
            return rootTestGroup.children;
        });
    }

    private parseTestLine(line: string, suiteConfig: SpecsSuiteConfig, rootTestGroup: TestGroup) {
        const suiteId = suiteConfig.idenfifier();
        const testInfoRegex = new RegExp(suiteConfig.discoveryRegex);
        const matches = testInfoRegex.exec(line);
        if (matches && matches.groups) {
            const filePath = matches.groups.filepath;
            const lineNumber = parseInt(matches.groups.linenumber);
            const fullTestDescription = matches.groups.description;
            if (suiteConfig.discoverySeparator) {
                const testDescriptionParts = fullTestDescription
                    .split(suiteConfig.discoverySeparator)
                    .map((part) => part.trim());

                const testDescription = testDescriptionParts.pop()?.trim()!;

                if (testDescriptionParts.length === 0) {
                    const test = new Test(suiteId, testDescription, filePath, lineNumber);
                    rootTestGroup.children.push(test);
                    return;
                }

                let currentTestGroup = rootTestGroup;
                testDescriptionParts.forEach((testGroupDescription) => {
                    let testGroup = currentTestGroup.children.find(
                        (child) => child.description === testGroupDescription,
                    );
                    if (!testGroup) {
                        testGroup = new TestGroup(suiteId, testGroupDescription, currentTestGroup);
                        currentTestGroup.children.push(testGroup);
                    }
                    currentTestGroup = testGroup as TestGroup;
                });

                const test = new Test(suiteId, testDescription, filePath, lineNumber, currentTestGroup);

                currentTestGroup.children.push(test);
            } else {
                const test = new Test(suiteId, fullTestDescription.trim(), filePath, lineNumber);
                rootTestGroup.children.push(test);
            }
        }
    }
}

const testManager = new TestManager();

export async function buildTestsProject(): Promise<void> {
    await testManager.build();
}

export async function runTest(suiteId: string, filePath: string, lineNumber: number): Promise<TestResult | undefined> {
    await testManager.build();
    return await testManager.run(suiteId, filePath, lineNumber);
}

export async function debugTest(suiteId: string, filePath: string, lineNumber: number) {
    await testManager.build();
    testManager.debug(suiteId, filePath, lineNumber);
}

export async function discoverTests(): Promise<ITestComponent[] | undefined> {
    await testManager.build();
    return await testManager.discover();
}
