import { ITestRunner, TestResult } from "./testRunner";
import * as vscode from "vscode";
import * as child_process from "child_process";

export class XmakeTestRunner implements ITestRunner {
    public async runTest(filePath: string, lineNumber: number): Promise<TestResult> {
        let testResult: TestResult = new TestResult();

        const command = `xmake run Tests "${filePath}" "${lineNumber}"`;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };

        return new Promise((resolve, reject) => {
            const child = child_process.exec(command, options, (error) => {
                if (error) reject(error);
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
}
