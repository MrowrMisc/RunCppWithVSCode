import * as vscode from "vscode";
import * as child_process from "child_process";
import { getSpecsConfig } from "./specsConfigFile";

class Test {
    constructor(public description: string, public filename: string, public linenumber: number) {}
}

class TestResult {
    constructor(public testOutput: string = "", public testPassed: boolean = false) {}
}

class TestRunner {
    public async build(): Promise<void> {
        const specsConfig = await getSpecsConfig();
        if (!specsConfig?.buildCommand) return;

        const command = specsConfig.buildCommand;
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

    public async run(filePath: string, lineNumber: number): Promise<TestResult | undefined> {
        const specsConfig = await getSpecsConfig();
        if (!specsConfig?.runCommand) {
            vscode.window.showErrorMessage("No run command specified in specs.json");
            return;
        }

        let testResult: TestResult = new TestResult();

        const command = `${specsConfig.runCommand} "${filePath}" "${lineNumber}"`;

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

    public async debug(filePath: string, lineNumber: number) {
        const specsConfig = await getSpecsConfig();
        if (!specsConfig?.debugCommand) {
            vscode.window.showErrorMessage("No debug command specified in specs.json");
            return;
        }

        // TODO: rename from 'debugCommand'
        const debugExecutable = specsConfig.debugCommand;

        vscode.debug.startDebugging(vscode.workspace.workspaceFolders?.[0], {
            name: "Debug Test",
            type: "cppvsdbg",
            request: "launch",
            program: debugExecutable,
            args: [filePath, lineNumber.toString()],
            // stopAtEntry: false,
            cwd: "${workspaceFolder}",
            environment: [],
            // externalConsole: false,
            // MIMode: "gdb",
            // miDebuggerPath: "/usr/bin/gdb",
            // setupCommands: [
            //     {
            //         description: "Enable pretty-printing for gdb",
            //         text: "-enable-pretty-printing",
            //         ignoreFailures: true,
            //     },
            // ],
        });
    }

    public async discover(): Promise<Test[] | undefined> {
        await this.build();

        const specsConfig = await getSpecsConfig();
        if (!specsConfig?.discoveryCommand) {
            vscode.window.showErrorMessage("No discovery command specified in specs.json");
            return;
        }

        const command = specsConfig.discoveryCommand;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };

        return new Promise((resolve, reject) => {
            const child = child_process.exec(command, options, (error) => {
                if (error) reject(error);
            });
            child.stdout?.on("data", (data) => {
                const tests: Test[] = [];
                const lines = data.split("\n");
                for (const line of lines) {
                    const test = this.parseTestLine(line);
                    if (test) tests.push(test);
                }
                resolve(tests);
            });
            child.stderr?.on("data", (data) => {
                reject(data);
            });
        });
    }

    private parseTestLine(line: string): Test | undefined {
        // The --list command will print out a list of all tests in the following format:
        // Test/File/Path.cpp:lineNumber:Test Description
        // Test/File/Path.cpp:lineNumber:Test Description 2
        //
        // Each test is printed on a separate line
        const regex = /(.+):(\d+):(.+)/;
        const matches = line.match(regex);
        if (matches && matches.length === 4) {
            const filePath = matches[1];
            const lineNumber = parseInt(matches[2]);
            const testDescription = matches[3];
            return new Test(testDescription, filePath, lineNumber);
        }
        return undefined;
    }
}

const testRunner = new TestRunner();

export async function buildTestsProject(): Promise<void> {
    await testRunner.build();
}

export async function runTest(
    filePath: string,
    lineNumber: number,
    debug: boolean = false
): Promise<TestResult | undefined> {
    return await testRunner.run(filePath, lineNumber);
}

export async function debugTest(filePath: string, lineNumber: number) {
    testRunner.debug(filePath, lineNumber);
}

export async function discoverTests(): Promise<Test[] | undefined> {
    return await testRunner.discover();
}
