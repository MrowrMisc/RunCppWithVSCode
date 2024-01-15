import * as vscode from "vscode";
import { registerCppTestController } from "./cppTestController";

export function activate(context: vscode.ExtensionContext) {
    registerCppTestController(context);
}

export function deactivate() {}
