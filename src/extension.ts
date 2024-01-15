import * as vscode from "vscode";
import { RegisterSpecsTestExtension } from "./TestExplorer";

export function activate(context: vscode.ExtensionContext) {
    RegisterSpecsTestExtension(context);
}

export function deactivate() {}
