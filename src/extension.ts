import * as vscode from "vscode";
import { registerTestCommand } from "./commands/runTestCommand";
import { registerTestCodeLens } from "./codelens/testMacroCodeLensProvider";

export function activate(context: vscode.ExtensionContext) {
    registerTestCommand(context);
    registerTestCodeLens(context);
}

export function deactivate() {}

////
// import * as child_process from "child_process";

// export function activate(context: vscode.ExtensionContext) {
//     let disposable = vscode.commands.registerCommand("runcppfunctionsextension.runSomeCpp", () => {
//         // vscode.window.showInformationMessage("Hello World from RunCppFunctionsExtension!");

//         const outputChannel = vscode.window.createOutputChannel("RunCppFunctionsExtension");
//         outputChannel.show();

//         // Run the command "xmake run Tests" and get its output and show it in the output channel
//         // Note that the command should be run from the root directory of the project
//         const command = "xmake run Tests Hello World";
//         const options = { cwd: vscode.workspace.rootPath };
//         const child = child_process.exec(command, options);
//         child.stdout?.on("data", (data) => {
//             outputChannel.append(data);
//         });
//         child.stderr?.on("data", (data) => {
//             outputChannel.append(data);
//         });
//         child.on("close", (code) => {
//             outputChannel.appendLine(`The process exited with code ${code}`);
//         });
//     });

//     context.subscriptions.push(disposable);
// }
