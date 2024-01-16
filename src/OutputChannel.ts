import * as vscode from "vscode";

const CHANNEL_NAME = "Specs Explorer";

export const SpecsExplorerOutput = vscode.window.createOutputChannel(CHANNEL_NAME);
