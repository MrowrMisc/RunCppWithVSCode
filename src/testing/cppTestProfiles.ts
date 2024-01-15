import * as vscode from "vscode";
import { cppTestController } from "./cppTestController";
import { runCppOutputChannel } from "../output/runCppOutputChannel";

function runHandler(shouldDebug: boolean, request: vscode.TestRunRequest, token: vscode.CancellationToken) {
    runCppOutputChannel.appendLine("RunHandler called");
    if (request.include) {
        runCppOutputChannel.appendLine(`Include: ${request.include.length}`);
        request.include.forEach((test) => {
            runCppOutputChannel.appendLine(`Include: ${test.id}`);
        });
    } else {
        runCppOutputChannel.appendLine("Include: none!");
    }
}

export const cppRunTestProfile = cppTestController.createRunProfile(
    "Run Profile",
    vscode.TestRunProfileKind.Run,
    (request, token) => {
        runHandler(false, request, token);
    }
);
