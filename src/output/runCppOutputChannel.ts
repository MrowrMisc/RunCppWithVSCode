import * as vscode from "vscode";

const runCppOutputChannelName = "Run C++ Stuff";

export const runCppOutputChannel = vscode.window.createOutputChannel(runCppOutputChannelName);
