import * as vscode from "vscode";
import { registerTestCommand } from "./commands/runTestCommand";
import { registerTestCodeLens } from "./codelens/testMacroCodeLensProvider";
import { registerCppTestController } from "./testing/cppTestController";

export function activate(context: vscode.ExtensionContext) {
    registerTestCommand(context);
    registerTestCodeLens(context);
    registerCppTestController(context);
}

export function deactivate() {}
