/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RegisterSpecsTestExtension = void 0;
const vscode = __importStar(__webpack_require__(2));
const TestManager_1 = __webpack_require__(3);
const TestTypes_1 = __webpack_require__(6);
const SpecsConfig_1 = __webpack_require__(5);
const CONTROLLER_ID = "specs-test-explorer";
const CONTROLLER_LABEL = "C++ Tests";
class TestExplorer {
    _controller;
    constructor() {
        this._controller = vscode.tests.createTestController(CONTROLLER_ID, CONTROLLER_LABEL);
        this._controller.refreshHandler = this.refresh.bind(this);
        this._controller.resolveHandler = async (test) => {
            if (test)
                vscode.window.showErrorMessage("Resolving individual tests is not supported");
            else
                await this.refresh();
        };
        this._controller.createRunProfile("Run", vscode.TestRunProfileKind.Run, this.run.bind(this), true);
        (0, SpecsConfig_1.getSpecsConfig)().then((config) => {
            if (config?.anySuitesSupportDebug())
                this._controller.createRunProfile("Debug", vscode.TestRunProfileKind.Debug, this.debug.bind(this), true);
        });
    }
    registerController(context) {
        context.subscriptions.push(this._controller);
    }
    registerTestComponent(discoveredIds, testComponent, parentTestItem) {
        if (testComponent.type === TestTypes_1.TestComponentType.Test) {
            const test = testComponent;
            const id = `${test.suiteId}|${test.filePath}:${test.lineNumber}`;
            discoveredIds.add(id);
            const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, test.filePath);
            const vscodeTest = this._controller.createTestItem(id, test.description, vscode.Uri.file(filePath.fsPath));
            vscodeTest.range = new vscode.Range(new vscode.Position(test.lineNumber - 1, 0), new vscode.Position(test.lineNumber - 1, 0));
            if (parentTestItem)
                parentTestItem.children.add(vscodeTest);
            else
                this._controller.items.add(vscodeTest);
        }
        else if (testComponent.type === TestTypes_1.TestComponentType.TestGroup) {
            const testGroup = testComponent;
            if (testGroup.description === "") {
                testGroup.children.forEach((child) => {
                    this.registerTestComponent(discoveredIds, child, parentTestItem);
                });
            }
            else {
                const id = `group: ${testGroup.fullDescription()}|${testGroup.suiteId}}`;
                discoveredIds.add(id);
                const vscodeTestGroup = this._controller.createTestItem(id, testGroup.description);
                if (parentTestItem)
                    parentTestItem.children.add(vscodeTestGroup);
                else
                    this._controller.items.add(vscodeTestGroup);
                testGroup.children.forEach((child) => {
                    this.registerTestComponent(discoveredIds, child, vscodeTestGroup);
                });
            }
        }
    }
    async refresh() {
        const existingTestIds = new Set();
        this._controller.items.forEach((test) => {
            existingTestIds.add(test.id);
        });
        const discoveredTestComponents = await (0, TestManager_1.discoverTests)();
        if (!discoveredTestComponents) {
            vscode.window.showErrorMessage("Failed to discover tests");
            this._controller.items.forEach((test) => {
                this._controller.items.delete(test.id);
            });
            return;
        }
        const discoveredIds = new Set();
        discoveredTestComponents.forEach((testComponent) => {
            this.registerTestComponent(discoveredIds, testComponent);
        });
        existingTestIds.forEach((id) => {
            if (!discoveredIds.has(id))
                this._controller.items.delete(id);
        });
    }
    addTestsToRun(test, testsToRun) {
        testsToRun.push(test);
        test.children.forEach((child) => {
            this.addTestsToRun(child, testsToRun);
        });
    }
    async run(request, token) {
        await (0, TestManager_1.buildTestsProject)();
        const run = this._controller.createTestRun(request);
        const testsToRun = [];
        if (request.include)
            request.include.forEach((test) => {
                this.addTestsToRun(test, testsToRun);
            });
        else
            this._controller.items.forEach((test) => {
                this.addTestsToRun(test, testsToRun);
            });
        run.appendOutput(`Running ${testsToRun.length} tests\n`);
        while (testsToRun.length > 0 && !token.isCancellationRequested) {
            const test = testsToRun.pop();
            if (request.exclude?.includes(test))
                continue;
            if (test.id.startsWith("group:"))
                continue; // or mark passed?
            const [suiteId, filenameAndLineNumber] = test.id.split("|");
            const [filename, linenumber] = filenameAndLineNumber.split(":");
            const start = Date.now();
            run.started(test);
            const testResult = await (0, TestManager_1.runTest)(suiteId, filename, parseInt(linenumber));
            if (!testResult)
                continue;
            const duration = Date.now() - start;
            if (testResult.testPassed)
                run.passed(test, duration);
            else
                run.failed(test, new vscode.TestMessage(testResult.testOutput), duration);
        }
        run.end();
    }
    async debug(request, token) {
        const debugAll = request.include === undefined;
        if (debugAll) {
            vscode.window.showErrorMessage("Debug all tests is not supported");
            return;
        }
        if (request.include.length > 1) {
            vscode.window.showErrorMessage("Debugging multiple tests is not supported");
            return;
        }
        const test = request.include[0];
        const [suiteId, filenameAndLineNumber] = test.id.split("|");
        const [filename, linenumber] = filenameAndLineNumber.split(":");
        await (0, TestManager_1.buildTestsProject)();
        await (0, TestManager_1.debugTest)(suiteId, filename, parseInt(linenumber));
    }
}
const testExplorer = new TestExplorer();
function RegisterSpecsTestExtension(context) {
    testExplorer.registerController(context);
}
exports.RegisterSpecsTestExtension = RegisterSpecsTestExtension;


/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.discoverTests = exports.debugTest = exports.runTest = exports.buildTestsProject = void 0;
const vscode = __importStar(__webpack_require__(2));
const child_process = __importStar(__webpack_require__(4));
const SpecsConfig_1 = __webpack_require__(5);
const TestTypes_1 = __webpack_require__(6);
class TestManager {
    async buildSuite(specsSuiteConfig) {
        if (specsSuiteConfig.isGroup)
            return;
        if (specsSuiteConfig.buildCommand) {
            const command = specsSuiteConfig.buildCommand;
            const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
            return new Promise((resolve) => {
                const child = child_process.exec(command, options);
                child.stdout?.on("data", (data) => {
                    console.log(data);
                });
                child.stderr?.on("data", (data) => {
                    console.log(data);
                });
                child.on("close", (code) => {
                    resolve();
                });
            });
        }
    }
    async build(suiteIds = undefined) {
        const specsConfig = await (0, SpecsConfig_1.getSpecsConfig)();
        if (!specsConfig?.suites.length) {
            vscode.window.showErrorMessage("No suites specified in specs.json");
            return;
        }
        if (!suiteIds)
            suiteIds = Array.from(specsConfig.suitesById.keys());
        if (!suiteIds.length)
            return;
        const promises = [];
        suiteIds.forEach((suiteId) => {
            const suiteConfig = specsConfig?.suitesById.get(suiteId);
            if (!suiteConfig?.isGroup) {
                if (suiteConfig?.buildCommand)
                    promises.push(this.buildSuite(suiteConfig));
            }
        });
        return Promise.all(promises).then(() => { });
    }
    async run(suiteId, filePath, lineNumber) {
        const specsConfig = await (0, SpecsConfig_1.getSpecsConfig)();
        const suiteConfig = specsConfig?.suitesById.get(suiteId);
        if (suiteConfig?.isGroup)
            return;
        if (!suiteConfig) {
            vscode.window.showErrorMessage(`Suite '${suiteId}' not found in specs.json`);
            return;
        }
        if (!suiteConfig?.runCommand) {
            vscode.window.showErrorMessage("No run command specified in specs.json");
            return;
        }
        let testResult = new TestTypes_1.TestResult();
        const command = `${suiteConfig.runCommand} "${filePath}" "${lineNumber}"`;
        return new Promise((resolve) => {
            const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
            const child = child_process.exec(command, options, (error) => {
                if (error)
                    testResult.testPassed = false;
            });
            child.stdout?.on("data", (data) => {
                testResult.testOutput += data;
            });
            child.stderr?.on("data", (data) => {
                testResult.testOutput += data;
            });
            child.on("close", (code) => {
                testResult.testPassed = code === 0;
                resolve(testResult);
            });
        });
    }
    async debug(suiteId, filePath, lineNumber) {
        const specsConfig = await (0, SpecsConfig_1.getSpecsConfig)();
        const suiteConfig = specsConfig?.suitesById.get(suiteId);
        if (!suiteConfig?.debugExecutable) {
            vscode.window.showErrorMessage("No debug command specified in specs.json");
            return;
        }
        vscode.debug.startDebugging(vscode.workspace.workspaceFolders?.[0], {
            name: "Debug Test",
            type: "cppvsdbg",
            request: "launch",
            program: suiteConfig.debugExecutable,
            args: [filePath, lineNumber.toString()],
            cwd: "${workspaceFolder}",
            environment: [],
        });
    }
    async discoverSuite(suiteId) {
        const specsConfig = await (0, SpecsConfig_1.getSpecsConfig)();
        const suiteConfig = specsConfig?.suitesById.get(suiteId);
        if (!suiteConfig) {
            vscode.window.showErrorMessage(`Suite '${suiteId}' not found in specs.json`);
            return;
        }
        if (suiteConfig?.isGroup)
            return;
        if (!suiteConfig?.discoveryCommand) {
            vscode.window.showErrorMessage("No discovery command specified in specs.json");
            return;
        }
        const command = suiteConfig.discoveryCommand;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
        return new Promise((resolve, reject) => {
            const child = child_process.exec(command, options, (error) => {
                if (error)
                    reject(error);
            });
            child.stdout?.on("data", (data) => {
                const rootTestGroup = new TestTypes_1.TestGroup(suiteId, suiteConfig.name);
                const lines = data.split("\n");
                for (const line of lines)
                    this.parseTestLine(line, suiteConfig, rootTestGroup);
                if (suiteConfig.name === "")
                    resolve(rootTestGroup.children);
                else
                    resolve([rootTestGroup]);
            });
        });
    }
    async discover(suiteIds = undefined) {
        const specsConfig = await (0, SpecsConfig_1.getSpecsConfig)();
        if (!specsConfig?.suites.length) {
            vscode.window.showErrorMessage("No suites specified in specs.json");
            return;
        }
        if (!suiteIds)
            suiteIds = Array.from(specsConfig.suitesById.keys());
        if (!suiteIds.length)
            return;
        const promises = [];
        suiteIds.forEach((suiteId) => {
            const suiteConfig = specsConfig?.suitesById.get(suiteId);
            if (suiteConfig?.discoveryCommand)
                promises.push(this.discoverSuite(suiteConfig.idenfifier()));
        });
        return Promise.all(promises).then((results) => {
            const rootTestGroup = new TestTypes_1.TestGroup();
            results.forEach((result) => {
                if (result)
                    rootTestGroup.children.push(...result);
            });
            return rootTestGroup.children;
        });
    }
    parseTestLine(line, suiteConfig, rootTestGroup) {
        const suiteId = suiteConfig.idenfifier();
        const testInfoRegex = new RegExp(suiteConfig.discoveryRegex);
        const matches = testInfoRegex.exec(line);
        if (matches && matches.groups) {
            const filePath = matches.groups.filepath;
            const lineNumber = parseInt(matches.groups.linenumber);
            const fullTestDescription = matches.groups.description;
            if (suiteConfig.discoverySeparator) {
                const testDescriptionParts = fullTestDescription
                    .split(suiteConfig.discoverySeparator)
                    .map((part) => part.trim());
                const testDescription = testDescriptionParts.pop()?.trim();
                if (testDescriptionParts.length === 0) {
                    const test = new TestTypes_1.Test(suiteId, testDescription, filePath, lineNumber);
                    rootTestGroup.children.push(test);
                    return;
                }
                let currentTestGroup = rootTestGroup;
                testDescriptionParts.forEach((testGroupDescription) => {
                    let testGroup = currentTestGroup.children.find((child) => child.description === testGroupDescription);
                    if (!testGroup) {
                        testGroup = new TestTypes_1.TestGroup(suiteId, testGroupDescription, currentTestGroup);
                        currentTestGroup.children.push(testGroup);
                    }
                    currentTestGroup = testGroup;
                });
                const test = new TestTypes_1.Test(suiteId, testDescription, filePath, lineNumber, currentTestGroup);
                currentTestGroup.children.push(test);
            }
            else {
                const test = new TestTypes_1.Test(suiteId, fullTestDescription.trim(), filePath, lineNumber);
                rootTestGroup.children.push(test);
            }
        }
    }
}
const testManager = new TestManager();
async function buildTestsProject() {
    await testManager.build();
}
exports.buildTestsProject = buildTestsProject;
async function runTest(suiteId, filePath, lineNumber) {
    return await testManager.run(suiteId, filePath, lineNumber);
}
exports.runTest = runTest;
async function debugTest(suiteId, filePath, lineNumber) {
    testManager.debug(suiteId, filePath, lineNumber);
}
exports.debugTest = debugTest;
async function discoverTests() {
    await testManager.build();
    return await testManager.discover();
}
exports.discoverTests = discoverTests;


/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getSpecsConfig = exports.SpecsSuiteConfig = exports.SpecsConfigFile = void 0;
const vscode = __importStar(__webpack_require__(2));
const SUITE_KEYS = ["build", "discover", "separator", "pattern", "run", "debug", "suites"];
class SpecsConfigFile {
    suites = [];
    defaults = new SpecsSuiteConfig();
    suitesById = new Map();
    anySuitesSupportDebug() {
        for (const suiteId in this.suitesById)
            if (this.suitesById.get(suiteId)?.debugExecutable)
                return true;
        return false;
    }
}
exports.SpecsConfigFile = SpecsConfigFile;
class SpecsSuiteConfig {
    isGroup = false;
    name;
    parent = undefined;
    children = [];
    buildCommand = undefined;
    discoveryCommand = "";
    discoverySeparator = undefined;
    discoveryRegex = "(?<filepath>.+):(?<linenumber>\\d+):(?<description>.+)";
    runCommand = "";
    debugExecutable = undefined;
    variables = {};
    constructor(name = "", parent = undefined) {
        this.name = name;
        this.parent = parent;
    }
    idenfifier() {
        if (this.parent)
            return `${this.parent.idenfifier()}/${this.name}`;
        else
            return this.name;
    }
}
exports.SpecsSuiteConfig = SpecsSuiteConfig;
function parseSuiteConfig(suiteJSON, specsConfigFile, parentSpecSuite = undefined) {
    if (suiteJSON.name === undefined)
        throw new Error("Suite name is required");
    const suiteConfig = new SpecsSuiteConfig(suiteJSON.name, parentSpecSuite);
    if (suiteJSON.group)
        suiteConfig.isGroup = suiteJSON.group;
    if (suiteJSON.build)
        suiteConfig.buildCommand = suiteJSON.build;
    if (suiteJSON.discover)
        suiteConfig.discoveryCommand = suiteJSON.discover;
    if (suiteJSON.separator)
        suiteConfig.discoverySeparator = suiteJSON.separator;
    if (suiteJSON.pattern)
        suiteConfig.discoveryRegex = suiteJSON.pattern;
    if (suiteJSON.run)
        suiteConfig.runCommand = suiteJSON.run;
    if (suiteJSON.debug)
        suiteConfig.debugExecutable = suiteJSON.debug;
    if (suiteJSON.suites)
        for (const childSuiteJSON of suiteJSON.suites)
            suiteConfig.children.push(parseSuiteConfig(childSuiteJSON, specsConfigFile));
    for (const key in suiteJSON)
        if (!SUITE_KEYS.includes(key))
            suiteConfig.variables[key] = suiteJSON[key];
    specsConfigFile.suitesById.set(suiteConfig.idenfifier(), suiteConfig);
    return suiteConfig;
}
function processVariables(suiteConfig) {
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
        if (suiteConfig.runCommand)
            suiteConfig.runCommand = suiteConfig.runCommand.replace(replaceText, variableValue);
        if (suiteConfig.debugExecutable)
            suiteConfig.debugExecutable = suiteConfig.debugExecutable.replace(replaceText, variableValue);
    });
}
function parseSpecsConfigFile(configJSON) {
    const specsConfig = new SpecsConfigFile();
    if (configJSON.suites) {
        for (const suiteJSON of configJSON.suites)
            specsConfig.suites.push(parseSuiteConfig(suiteJSON, specsConfig));
    }
    else if (configJSON.run || configJSON.discover) {
        if (!configJSON.name)
            configJSON.name = "";
        specsConfig.suites.push(parseSuiteConfig(configJSON, specsConfig));
    }
    if (configJSON.defaults) {
        if (!configJSON.defaults.name)
            configJSON.defaults.name = "defaults";
        specsConfig.defaults = parseSuiteConfig(configJSON.defaults, specsConfig);
        specsConfig.defaults.isGroup = true;
    }
    specsConfig.suitesById.forEach((suiteConfig) => {
        if (!suiteConfig.isGroup) {
            if (!suiteConfig.buildCommand)
                suiteConfig.buildCommand = specsConfig.defaults.buildCommand;
            if (!suiteConfig.discoveryCommand)
                suiteConfig.discoveryCommand = specsConfig.defaults.discoveryCommand;
            if (!suiteConfig.discoverySeparator)
                suiteConfig.discoverySeparator = specsConfig.defaults.discoverySeparator;
            if (!suiteConfig.discoveryRegex)
                suiteConfig.discoveryRegex = specsConfig.defaults.discoveryRegex;
            if (!suiteConfig.runCommand)
                suiteConfig.runCommand = specsConfig.defaults.runCommand;
            if (!suiteConfig.debugExecutable)
                suiteConfig.debugExecutable = specsConfig.defaults.debugExecutable;
            for (const key in specsConfig.defaults.variables)
                if (!suiteConfig.variables[key])
                    suiteConfig.variables[key] = specsConfig.defaults.variables[key];
        }
    });
    specsConfig.suitesById.forEach((suiteConfig) => {
        processVariables(suiteConfig);
    });
    return specsConfig;
}
async function readSpecsConfigFile() {
    const file = await vscode.workspace.findFiles(specConfigFileName);
    if (file.length > 0) {
        const content = await vscode.workspace.fs.readFile(file[0]);
        const config = JSON.parse(content.toString());
        return parseSpecsConfigFile(config);
    }
    else {
        vscode.window.showErrorMessage("No specs config file found");
    }
}
const specConfigFileName = ".specs.json";
async function getSpecsConfig() {
    return await readSpecsConfigFile();
}
exports.getSpecsConfig = getSpecsConfig;


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestResult = exports.Test = exports.TestGroup = exports.TestComponentType = void 0;
var TestComponentType;
(function (TestComponentType) {
    TestComponentType[TestComponentType["Test"] = 0] = "Test";
    TestComponentType[TestComponentType["TestGroup"] = 1] = "TestGroup";
})(TestComponentType || (exports.TestComponentType = TestComponentType = {}));
class TestComponent {
    suiteId;
    type = TestComponentType.Test;
    description;
    group;
    constructor(suiteId, description, group = undefined) {
        this.suiteId = suiteId;
        this.description = description;
        this.group = group;
    }
    fullDescription() {
        if (this.group)
            return `${this.group.fullDescription()} > ${this.description}`;
        else
            return this.description;
    }
}
// Class TestGroup which inherits from TestComponent and additionally contains a list of children TestComponents
class TestGroup extends TestComponent {
    type = TestComponentType.TestGroup;
    children = [];
    constructor(suiteId = undefined, description = "", group = undefined) {
        super(suiteId, description, group);
    }
    isRootGroup() {
        return this.group === undefined;
    }
}
exports.TestGroup = TestGroup;
// Class Test which inherits from TestComponent and additionally contains a file path and line number
class Test extends TestComponent {
    filePath;
    lineNumber;
    constructor(suiteId, description, filePath, lineNumber, group = undefined) {
        super(suiteId, description, group);
        this.filePath = filePath;
        this.lineNumber = lineNumber;
    }
}
exports.Test = Test;
class TestResult {
    testOutput;
    testPassed;
    constructor(testOutput = "", testPassed = false) {
        this.testOutput = testOutput;
        this.testPassed = testPassed;
    }
}
exports.TestResult = TestResult;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const TestExplorer_1 = __webpack_require__(1);
// TODO: GROUPS!
// TODO: TAGS!
function activate(context) {
    (0, TestExplorer_1.RegisterSpecsTestExtension)(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map