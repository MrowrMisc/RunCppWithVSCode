import * as vscode from "vscode";

export class SpecsConfigFile {
    suites: SpecsSuiteConfig[] = [];
    defaults: SpecsSuiteConfig = new SpecsSuiteConfig();
    suitesById: Map<string, SpecsSuiteConfig> = new Map<string, SpecsSuiteConfig>();
    anySuitesSupportDebug(): boolean {
        for (const suiteId in this.suitesById) if (this.suitesById.get(suiteId)?.debugExecutable) return true;
        return false;
    }
}

export class SpecsSuiteConfig {
    public isGroup: boolean = false;
    public name: string;
    public parent: SpecsSuiteConfig | undefined = undefined;
    public children: SpecsSuiteConfig[] = [];
    public buildCommand: string | undefined = undefined;
    public discoveryCommand: string = "";
    public discoverySeparator: string | undefined = undefined;
    public discoveryRegex: string | undefined = undefined;
    public runCommand: string = "";
    public debugExecutable: string | undefined = undefined;
    public debugger: string | undefined = undefined;
    public variables: { [key: string]: string } = {};

    constructor(name: string = "", parent: SpecsSuiteConfig | undefined = undefined) {
        this.name = name;
        this.parent = parent;
    }

    idenfifier(): string {
        if (this.parent) return `${this.parent.idenfifier()}/${this.name}`;
        else return this.name;
    }
}

function parseSuiteConfig(
    suiteJSON: any,
    specsConfigFile: SpecsConfigFile,
    parentSpecSuite: SpecsSuiteConfig | undefined = undefined,
): SpecsSuiteConfig {
    if (suiteJSON.name === undefined) throw new Error("Suite name is required");

    const suiteConfig = new SpecsSuiteConfig(suiteJSON.name, parentSpecSuite);

    if (suiteJSON.group) suiteConfig.isGroup = suiteJSON.group;
    if (suiteJSON.build) suiteConfig.buildCommand = suiteJSON.build;
    if (suiteJSON.discover) suiteConfig.discoveryCommand = suiteJSON.discover;
    if (suiteJSON.separator) suiteConfig.discoverySeparator = suiteJSON.separator;
    if (suiteJSON.pattern) suiteConfig.discoveryRegex = suiteJSON.pattern;
    if (suiteJSON.run) suiteConfig.runCommand = suiteJSON.run;
    if (suiteJSON.debug) suiteConfig.debugExecutable = suiteJSON.debug;
    if (suiteJSON.debugger) suiteConfig.debugger = suiteJSON.debugger;

    if (suiteJSON.suites)
        for (const childSuiteJSON of suiteJSON.suites)
            suiteConfig.children.push(parseSuiteConfig(childSuiteJSON, specsConfigFile));

    for (const key in suiteJSON) suiteConfig.variables[key] = suiteJSON[key];

    specsConfigFile.suitesById.set(suiteConfig.idenfifier(), suiteConfig);

    return suiteConfig;
}

function processVariables(suiteConfig: SpecsSuiteConfig) {
    const variables = suiteConfig.variables;
    Object.keys(variables).forEach((variableName) => {
        const variableValue = variables[variableName];
        const replaceText = "$" + variableName;
        if (suiteConfig.buildCommand)
            suiteConfig.buildCommand = suiteConfig.buildCommand.replace(replaceText, variableValue);
        if (suiteConfig.discoveryCommand)
            suiteConfig.discoveryCommand = suiteConfig.discoveryCommand.replace(replaceText, variableValue);
        if (suiteConfig.discoverySeparator)
            suiteConfig.discoverySeparator = suiteConfig.discoverySeparator.replace(replaceText, variableValue);
        if (suiteConfig.discoveryRegex)
            suiteConfig.discoveryRegex = suiteConfig.discoveryRegex.replace(replaceText, variableValue);
        if (suiteConfig.runCommand) suiteConfig.runCommand = suiteConfig.runCommand.replace(replaceText, variableValue);
        if (suiteConfig.debugExecutable)
            suiteConfig.debugExecutable = suiteConfig.debugExecutable.replace(replaceText, variableValue);
        if (suiteConfig.debugger) suiteConfig.debugger = suiteConfig.debugger.replace(replaceText, variableValue);
    });
}

function parseSpecsConfigFile(configJSON: any): SpecsConfigFile {
    const specsConfig = new SpecsConfigFile();

    if (configJSON.suites) {
        for (const suiteJSON of configJSON.suites) specsConfig.suites.push(parseSuiteConfig(suiteJSON, specsConfig));
    } else if (configJSON.run || configJSON.discover) {
        if (!configJSON.name) configJSON.name = "";
        specsConfig.suites.push(parseSuiteConfig(configJSON, specsConfig));
    }

    if (configJSON.defaults) {
        if (!configJSON.defaults.name) configJSON.defaults.name = "defaults";
        specsConfig.defaults = parseSuiteConfig(configJSON.defaults, specsConfig);
        specsConfig.defaults.isGroup = true;
    }

    specsConfig.suitesById.forEach((suiteConfig) => {
        if (!suiteConfig.isGroup) {
            if (!suiteConfig.buildCommand) suiteConfig.buildCommand = specsConfig.defaults.buildCommand;
            if (!suiteConfig.discoveryCommand) suiteConfig.discoveryCommand = specsConfig.defaults.discoveryCommand;
            if (!suiteConfig.discoverySeparator)
                suiteConfig.discoverySeparator = specsConfig.defaults.discoverySeparator;
            if (!suiteConfig.discoveryRegex) suiteConfig.discoveryRegex = specsConfig.defaults.discoveryRegex;
            if (!suiteConfig.runCommand) suiteConfig.runCommand = specsConfig.defaults.runCommand;
            if (!suiteConfig.debugExecutable) suiteConfig.debugExecutable = specsConfig.defaults.debugExecutable;
            for (const key in specsConfig.defaults.variables)
                if (!suiteConfig.variables[key]) suiteConfig.variables[key] = specsConfig.defaults.variables[key];
        }
    });

    specsConfig.suitesById.forEach((suiteConfig) => {
        processVariables(suiteConfig);
    });

    return specsConfig;
}

async function readSpecsConfigFile(): Promise<SpecsConfigFile | undefined> {
    const file = await vscode.workspace.findFiles(specConfigFileName);
    if (file.length > 0) {
        const content = await vscode.workspace.fs.readFile(file[0]);
        const config = JSON.parse(content.toString());
        return parseSpecsConfigFile(config);
    } else {
        vscode.window.showErrorMessage("No specs config file found");
    }
}

const specConfigFileName = ".specs.json";

export async function getSpecsConfig(): Promise<SpecsConfigFile | undefined> {
    return await readSpecsConfigFile();
}
