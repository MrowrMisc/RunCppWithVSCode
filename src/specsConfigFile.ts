import { spec } from "node:test/reporters";
import * as vscode from "vscode";

class SpecsConfigFile {
    public buildCommand: string | undefined = undefined;
    public discoveryCommand: string = "";
    public runCommand: string = "";
    public debugCommand: string | undefined = undefined;
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
        specsConfig.buildCommand = config.build;
        specsConfig.discoveryCommand = config.discover;
        specsConfig.runCommand = config.run;
        specsConfig.debugCommand = config.debug;
        return specsConfig;
    } else {
        vscode.window.showErrorMessage("No specs config file found");
    }
}

const specConfigFileName = ".specs.json";

export async function getSpecsConfig(): Promise<SpecsConfigFile | undefined> {
    return await readSpecsConfigFile();
}
