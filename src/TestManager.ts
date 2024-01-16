import * as vscode from "vscode";
import * as child_process from "child_process";
import { getSpecsConfig, SpecsSuiteConfig } from "./SpecsConfig";
import { ITestComponent, Test, TestGroup, TestResult } from "./TestTypes";
import { SpecsExplorerOutput } from "./OutputChannel";

class TestManager {
    async buildSuite(specsSuiteConfig: SpecsSuiteConfig): Promise<void> {
        if (specsSuiteConfig.isGroup) return;
        if (specsSuiteConfig.buildCommand) {
            const command = specsSuiteConfig.buildCommand;
            const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
            return new Promise((resolve) => {
                SpecsExplorerOutput.appendLine(`Running ${command}`);
                const child = child_process.exec(command, options);
                child.stdout?.on("data", (data) => {
                    SpecsExplorerOutput.appendLine(data);
                });
                child.stderr?.on("data", (data) => {
                    SpecsExplorerOutput.appendLine(data);
                });
                child.on("close", (code) => {
                    SpecsExplorerOutput.appendLine(`Command ${command} exited with code ${code}`);
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

        // TODO HERE! USE REPLACEMENT TOKEN THINGS!
        const command = suiteConfig.runCommand.replace("{file}", filePath).replace("{line}", lineNumber.toString());

        return new Promise((resolve) => {
            const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
            SpecsExplorerOutput.appendLine(`Running ${command}`);
            const child = child_process.exec(command, options, (error) => {
                if (error) testResult.testPassed = false;
            });
            child.stdout?.on("data", (data) => {
                SpecsExplorerOutput.appendLine(data);
                testResult.testOutput += data;
            });
            child.stderr?.on("data", (data) => {
                SpecsExplorerOutput.appendLine(data);
                testResult.testOutput += data;
            });
            child.on("close", (code) => {
                SpecsExplorerOutput.appendLine(`Command ${command} exited with code ${code}`);
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
        if (!suiteConfig?.debugger) {
            vscode.window.showErrorMessage("No debugger specified (e.g. cppvsdbg) in specs.json");
            return;
        }

        vscode.debug.startDebugging(vscode.workspace.workspaceFolders?.[0], {
            name: "Debug Test",
            type: suiteConfig.debugger,
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
            vscode.window.showErrorMessage("No discovery command (discover:) specified in specs.json");
            return;
        }
        if (!suiteConfig?.discoveryRegex) {
            vscode.window.showErrorMessage("No discovery regex (pattern:) specified in specs.json");
            return;
        }

        const command = suiteConfig.discoveryCommand;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };

        return new Promise((resolve, reject) => {
            SpecsExplorerOutput.appendLine(`Running ${command}`);
            const child = child_process.exec(command, options, (error) => {
                if (error) reject(error);
            });
            child.stdout?.on("data", (data) => {
                SpecsExplorerOutput.appendLine(data);
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
        const testInfoRegex = new RegExp(suiteConfig.discoveryRegex!);
        const matches = testInfoRegex.exec(line);
        if (matches && matches.groups) {
            const filePath = matches.groups.filepath;
            const lineNumber = parseInt(matches.groups.linenumber);
            const fullTestDescription = matches.groups.description.trim();
            SpecsExplorerOutput.appendLine(`Discovered test: ${fullTestDescription} (${filePath}:${lineNumber})`);
            if (suiteConfig.discoverySeparator) {
                const testDescriptionParts = fullTestDescription
                    .split(suiteConfig.discoverySeparator)
                    .map((part) => part.trim());

                const testDescription = testDescriptionParts.pop()?.trim()!;

                if (testDescriptionParts.length === 0) {
                    SpecsExplorerOutput.appendLine(
                        `Adding test ${testDescription} to root group (${suiteId}) [${filePath}:${lineNumber}]`,
                    );
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
                        SpecsExplorerOutput.appendLine(
                            `Adding test group ${testGroupDescription} to group ${currentTestGroup.description} (${suiteId}) [${filePath}:${lineNumber}]`,
                        );
                        testGroup = new TestGroup(suiteId, testGroupDescription, currentTestGroup);
                        currentTestGroup.children.push(testGroup);
                    }
                    currentTestGroup = testGroup as TestGroup;
                });

                SpecsExplorerOutput.appendLine(
                    `Adding test ${testDescription} to group ${currentTestGroup.description} (${suiteId}) [${filePath}:${lineNumber}]`,
                );
                const test = new Test(suiteId, testDescription, filePath, lineNumber, currentTestGroup);

                currentTestGroup.children.push(test);
            } else {
                SpecsExplorerOutput.appendLine(
                    `Adding test ${fullTestDescription.trim()} to root group (${suiteId}) [${filePath}:${lineNumber}]`,
                );
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
    return await testManager.run(suiteId, filePath, lineNumber);
}

export async function debugTest(suiteId: string, filePath: string, lineNumber: number) {
    testManager.debug(suiteId, filePath, lineNumber);
}

export async function discoverTests(): Promise<ITestComponent[] | undefined> {
    await testManager.build();
    return await testManager.discover();
}
