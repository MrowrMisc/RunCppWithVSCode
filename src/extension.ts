import * as vscode from "vscode";
import { RegisterSpecsTestExtension } from "./TestExplorer";

// TODO: GROUPS!
// TODO: TAGS!

export function activate(context: vscode.ExtensionContext) {
    RegisterSpecsTestExtension(context);
}

export function deactivate() {}
