import { ITestAdapter, TestResult, Test } from "./testRunner";
import * as vscode from "vscode";
import * as child_process from "child_process";

export class XmakeTestRunner implements ITestAdapter {
    public async buildTestTarget(): Promise<void> {
        const command = `xmake build -y -w Tests`;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };

        return new Promise((resolve, reject) => {
            const child = child_process.exec(command, options, (error) => {
                if (error) reject(error);
            });
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

    public async runTest(filePath: string, lineNumber: number): Promise<TestResult> {
        let testResult: TestResult = new TestResult();

        const command = `xmake run Tests "${filePath}" "${lineNumber}"`;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };

        return new Promise((resolve, reject) => {
            const child = child_process.exec(command, options, (error) => {
                if (error) {
                    testResult.testOutput += error.message;
                    testResult.testPassed = false;
                    resolve(testResult);
                }
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

    public async discoverTests(): Promise<Test[]> {
        const command = `xmake run Tests --list`;
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
