import * as vscode from "vscode";
import { registerTestCommand } from "./commands/runTestCommand";
import { registerTestCodeLens } from "./codelens/testMacroCodeLensProvider";

export function activate(context: vscode.ExtensionContext) {
    registerTestCommand(context);
    registerTestCodeLens(context);
}

export function deactivate() {}
