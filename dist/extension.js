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
const TestRunner_1 = __webpack_require__(3);
const TestTypes_1 = __webpack_require__(6);
const SpecsConfig_1 = __webpack_require__(5);
const CONTROLLER_ID = "this._controller";
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
            if (config?.debugCommand)
                this._controller.createRunProfile("Debug", vscode.TestRunProfileKind.Debug, this.debug.bind(this), true);
        });
    }
    registerController(context) {
        context.subscriptions.push(this._controller);
    }
    async refresh() {
        const existingTestIds = new Set();
        this._controller.items.forEach((test) => {
            existingTestIds.add(test.id);
        });
        const tests = await (0, TestRunner_1.discoverTests)();
        if (!tests) {
            vscode.window.showErrorMessage("Failed to discover tests");
            this._controller.items.forEach((test) => {
                this._controller.items.delete(test.id);
            });
            return;
        }
        const discoveredTestIds = new Set();
        tests.forEach((testComponent) => {
            if (testComponent.type !== TestTypes_1.TestComponentType.Test)
                return;
            const test = testComponent;
            const id = `${test.filePath}:${test.lineNumber}`;
            discoveredTestIds.add(id);
            const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, test.filePath);
            const vscodeTest = this._controller.createTestItem(id, test.description, vscode.Uri.file(filePath.fsPath));
            vscodeTest.range = new vscode.Range(new vscode.Position(test.lineNumber - 1, 0), new vscode.Position(test.lineNumber - 1, 0));
            this._controller.items.add(vscodeTest);
        });
        existingTestIds.forEach((id) => {
            if (!discoveredTestIds.has(id))
                this._controller.items.delete(id);
        });
    }
    async run(request, token) {
        await (0, TestRunner_1.buildTestsProject)();
        const run = this._controller.createTestRun(request);
        const testsToRun = [];
        if (request.include)
            request.include.forEach((test) => {
                testsToRun.push(test);
            });
        else
            this._controller.items.forEach((test) => {
                testsToRun.push(test);
            });
        run.appendOutput(`Running ${testsToRun.length} tests\n`);
        while (testsToRun.length > 0 && !token.isCancellationRequested) {
            const test = testsToRun.pop();
            if (request.exclude?.includes(test))
                continue;
            const [filename, linenumber] = test.id.split(":");
            const start = Date.now();
            run.started(test);
            const testResult = await (0, TestRunner_1.runTest)(filename, parseInt(linenumber));
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
        const [filename, linenumber] = test.id.split(":");
        await (0, TestRunner_1.buildTestsProject)();
        await (0, TestRunner_1.debugTest)(filename, parseInt(linenumber));
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
class TestRunner {
    async build() {
        const specsConfig = await (0, SpecsConfig_1.getSpecsConfig)();
        if (!specsConfig?.buildCommand)
            return;
        const command = specsConfig.buildCommand;
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
    async run(filePath, lineNumber) {
        const specsConfig = await (0, SpecsConfig_1.getSpecsConfig)();
        if (!specsConfig?.runCommand) {
            vscode.window.showErrorMessage("No run command specified in specs.json");
            return;
        }
        let testResult = new TestTypes_1.TestResult();
        const command = `${specsConfig.runCommand} "${filePath}" "${lineNumber}"`;
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
    async debug(filePath, lineNumber) {
        const specsConfig = await (0, SpecsConfig_1.getSpecsConfig)();
        if (!specsConfig?.debugCommand) {
            vscode.window.showErrorMessage("No debug command specified in specs.json");
            return;
        }
        // TODO: rename from 'debugCommand'
        const debugExecutable = specsConfig.debugCommand;
        vscode.debug.startDebugging(vscode.workspace.workspaceFolders?.[0], {
            name: "Debug Test",
            type: "cppvsdbg",
            request: "launch",
            program: debugExecutable,
            args: [filePath, lineNumber.toString()],
            // stopAtEntry: false,
            cwd: "${workspaceFolder}",
            environment: [],
            // externalConsole: false,
            // MIMode: "gdb",
            // miDebuggerPath: "/usr/bin/gdb",
            // setupCommands: [
            //     {
            //         description: "Enable pretty-printing for gdb",
            //         text: "-enable-pretty-printing",
            //         ignoreFailures: true,
            //     },
            // ],
        });
    }
    async discover() {
        await this.build();
        const specsConfig = await (0, SpecsConfig_1.getSpecsConfig)();
        if (!specsConfig?.discoveryCommand) {
            vscode.window.showErrorMessage("No discovery command specified in specs.json");
            return;
        }
        const command = specsConfig.discoveryCommand;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
        return new Promise((resolve, reject) => {
            const child = child_process.exec(command, options, (error) => {
                if (error)
                    reject(error);
            });
            child.stdout?.on("data", (data) => {
                const tests = [];
                const lines = data.split("\n");
                for (const line of lines) {
                    const test = this.parseTestLine(line);
                    if (test)
                        tests.push(test);
                }
                resolve(tests);
            });
            child.stderr?.on("data", (data) => {
                reject(data);
            });
        });
    }
    parseTestLine(line) {
        // TODO: make regex configurable and use NAMED captures :)
        const regex = /(.+):(\d+):(.+)/;
        const matches = line.match(regex);
        if (matches && matches.length === 4) {
            const filePath = matches[1];
            const lineNumber = parseInt(matches[2]);
            const testDescription = matches[3];
            return new TestTypes_1.Test(testDescription, filePath, lineNumber);
        }
        return undefined;
    }
}
const testRunner = new TestRunner();
async function buildTestsProject() {
    await testRunner.build();
}
exports.buildTestsProject = buildTestsProject;
async function runTest(filePath, lineNumber) {
    return await testRunner.run(filePath, lineNumber);
}
exports.runTest = runTest;
async function debugTest(filePath, lineNumber) {
    testRunner.debug(filePath, lineNumber);
}
exports.debugTest = debugTest;
async function discoverTests() {
    return await testRunner.discover();
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
exports.getSpecsConfig = void 0;
const vscode = __importStar(__webpack_require__(2));
class SpecsConfigFile {
    buildCommand = undefined;
    discoveryCommand = "";
    discoverySeparator = undefined;
    runCommand = "";
    debugCommand = undefined;
}
async function readSpecsConfigFile() {
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
        specsConfig.discoverySeparator = config.separator;
        specsConfig.runCommand = config.run;
        specsConfig.debugCommand = config.debug;
        return specsConfig;
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
    type = TestComponentType.Test;
    description;
    group;
    constructor(description, group = undefined) {
        this.description = description;
        this.group = group;
    }
    fullDescription() {
        if (this.group)
            return `${this.group.fullDescription()}.${this.description}`;
        else
            return this.description;
    }
}
// Class TestGroup which inherits from TestComponent and additionally contains a list of children TestComponents
class TestGroup extends TestComponent {
    children = [];
    constructor(description, group = undefined) {
        super(description, group);
    }
}
exports.TestGroup = TestGroup;
// Class Test which inherits from TestComponent and additionally contains a file path and line number
class Test extends TestComponent {
    filePath;
    lineNumber;
    constructor(description, filePath, lineNumber, group = undefined) {
        super(description, group);
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