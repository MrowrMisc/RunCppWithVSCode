import { spec } from "node:test/reporters";
import * as vscode from "vscode";

class SpecsConfigFile {
    public buildCommand: string | undefined = undefined;
    public discoveryCommand: string = "";
    public runCommand: string = "";
}

async function readSpecsConfigFile(): Promise<SpecsConfigFile | undefined> {
    const file = await vscode.workspace.findFiles(specConfigFileName);
    if (file.length > 0) {
        const content = await vscode.workspace.fs.readFile(file[0]);
        const config = JSON.parse(content.toString());
        if (!config.run) {
            vscode.window.showErrorMessage("No run: command found in specs config file");
            return;
        }
        if (!config.discover) {
            vscode.window.showErrorMessage("No discover: command found in specs config file");
            return;
        }
        const specsConfig = new SpecsConfigFile();
        specsConfig.runCommand = config.run;
        specsConfig.buildCommand = config.build;
        specsConfig.discoveryCommand = config.discover;
        return specsConfig;
    } else {
        vscode.window.showErrorMessage("No specs config file found");
    }
}

const specConfigFileName = ".specs.json";
let currentSpecsConfig: SpecsConfigFile | undefined = undefined;

export async function getSpecsConfig(): Promise<SpecsConfigFile | undefined> {
    if (!currentSpecsConfig) currentSpecsConfig = await readSpecsConfigFile();
    return currentSpecsConfig;
}
