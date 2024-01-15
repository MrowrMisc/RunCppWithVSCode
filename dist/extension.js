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
exports.registerCppTestController = exports.cppTestController = void 0;
const vscode = __importStar(__webpack_require__(2));
const runCppOutputChannel_1 = __webpack_require__(3);
const testRunner_1 = __webpack_require__(4);
const testResultDiagnostics_1 = __webpack_require__(7);
exports.cppTestController = vscode.tests.createTestController("cppTestController", "C++ Tests");
async function discover() {
    const tests = await (0, testRunner_1.discoverTests)();
    if (!tests)
        return;
    runCppOutputChannel_1.runCppOutputChannel.appendLine(`Discovered ${tests.length} tests`);
    tests.forEach((test) => {
        const id = `${test.filename}:${test.linenumber}`;
        const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, test.filename);
        const vscodeTest = exports.cppTestController.createTestItem(id, test.description, vscode.Uri.file(filePath.fsPath));
        vscodeTest.range = new vscode.Range(new vscode.Position(test.linenumber - 1, 0), new vscode.Position(test.linenumber - 1, 0));
        exports.cppTestController.items.add(vscodeTest);
    });
}
exports.cppTestController.resolveHandler = async (test) => {
    if (test) {
        runCppOutputChannel_1.runCppOutputChannel.appendLine(`ResolveHandler called for ${test.id}`);
    }
    else {
        runCppOutputChannel_1.runCppOutputChannel.appendLine("ResolveHandler called for the first time");
        await discover();
    }
};
exports.cppTestController.refreshHandler = async () => {
    runCppOutputChannel_1.runCppOutputChannel.appendLine("RefreshHandler called");
    exports.cppTestController.items.forEach((test) => {
        exports.cppTestController.items.delete(test.id);
    });
    await (0, testRunner_1.buildTestsProject)();
    await discover();
};
function registerCppTestController(context) {
    context.subscriptions.push(exports.cppTestController);
}
exports.registerCppTestController = registerCppTestController;
async function runHandler(shouldDebug, request, token) {
    testResultDiagnostics_1.testResultDiagnosticCollection.clear();
    const run = exports.cppTestController.createTestRun(request);
    run.appendOutput("Running tests...\n");
    await (0, testRunner_1.buildTestsProject)();
    const testsToRun = [];
    if (request.include)
        request.include.forEach((test) => {
            testsToRun.push(test);
        });
    else
        exports.cppTestController.items.forEach((test) => {
            testsToRun.push(test);
        });
    runCppOutputChannel_1.runCppOutputChannel.appendLine(`Running ${testsToRun.length} tests`);
    run.appendOutput(`Running ${testsToRun.length} tests\n`);
    while (testsToRun.length > 0 && !token.isCancellationRequested) {
        const test = testsToRun.pop();
        if (request.exclude?.includes(test)) {
            runCppOutputChannel_1.runCppOutputChannel.appendLine(`Skipping ${test.id}`);
            continue;
        }
        runCppOutputChannel_1.runCppOutputChannel.appendLine(`Running ${test.id}`);
        const [filename, linenumber] = test.id.split(":");
        // const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, filename);
        const start = Date.now();
        run.started(test);
        const testResult = await (0, testRunner_1.runTest)(filename, parseInt(linenumber));
        if (!testResult)
            continue;
        const duration = Date.now() - start;
        if (testResult.testPassed) {
            runCppOutputChannel_1.runCppOutputChannel.appendLine(`Test ${test.id} passed`);
            run.appendOutput(testResult.testOutput);
            run.passed(test, duration);
        }
        else {
            runCppOutputChannel_1.runCppOutputChannel.appendLine(`Test ${test.id} failed`);
            run.appendOutput(testResult.testOutput);
            run.failed(test, new vscode.TestMessage(testResult.testOutput), duration);
        }
    }
    run.end();
}
const cppRunTestProfile = exports.cppTestController.createRunProfile("Run Tests", vscode.TestRunProfileKind.Run, (request, token) => {
    runHandler(false, request, token);
}, true);


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
exports.runCppOutputChannel = void 0;
const vscode = __importStar(__webpack_require__(2));
const runCppOutputChannelName = "Run C++ Stuff";
exports.runCppOutputChannel = vscode.window.createOutputChannel(runCppOutputChannelName);


/***/ }),
/* 4 */
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
exports.discoverTests = exports.runTest = exports.buildTestsProject = void 0;
const vscode = __importStar(__webpack_require__(2));
const child_process = __importStar(__webpack_require__(5));
const specsConfigFile_1 = __webpack_require__(6);
class Test {
    description;
    filename;
    linenumber;
    constructor(description, filename, linenumber) {
        this.description = description;
        this.filename = filename;
        this.linenumber = linenumber;
    }
}
class TestResult {
    testOutput;
    testPassed;
    constructor(testOutput = "", testPassed = false) {
        this.testOutput = testOutput;
        this.testPassed = testPassed;
    }
}
class TestRunner {
    async build() {
        const specsConfig = await (0, specsConfigFile_1.getSpecsConfig)();
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
        const specsConfig = await (0, specsConfigFile_1.getSpecsConfig)();
        if (!specsConfig?.runCommand)
            return;
        let testResult = new TestResult();
        const command = `${specsConfig.runCommand} "${filePath}" "${lineNumber}"`;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
        return new Promise((resolve) => {
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
    async discover() {
        await this.build();
        const specsConfig = await (0, specsConfigFile_1.getSpecsConfig)();
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
        // The --list command will print out a list of all tests in the following format:
        // Test/File/Path.cpp:lineNumber:Test Description
        // Test/File/Path.cpp:lineNumber:Test Description 2
        //
        // Each test is printed on a separate line
        const regex = /(.+):(\d+):(.+)/;
        const matches = line.match(regex);
        if (matches && matches.length === 4) {
            const filePath = matches[1];
            const lineNumber = parseInt(matches[2]);
            const testDescription = matches[3];
            return new Test(testDescription, filePath, lineNumber);
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
async function discoverTests() {
    return await testRunner.discover();
}
exports.discoverTests = discoverTests;


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 6 */
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
    runCommand = "";
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
        specsConfig.runCommand = config.run;
        specsConfig.buildCommand = config.build;
        specsConfig.discoveryCommand = config.discover;
        return specsConfig;
    }
    else {
        vscode.window.showErrorMessage("No specs config file found");
    }
}
const specConfigFileName = ".specs.json";
let currentSpecsConfig = undefined;
async function getSpecsConfig() {
    if (!currentSpecsConfig)
        currentSpecsConfig = await readSpecsConfigFile();
    return currentSpecsConfig;
}
exports.getSpecsConfig = getSpecsConfig;


/***/ }),
/* 7 */
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
exports.testResultDiagnosticCollection = void 0;
const vscode = __importStar(__webpack_require__(2));
exports.testResultDiagnosticCollection = vscode.languages.createDiagnosticCollection("our-test-results");


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
const cppTestController_1 = __webpack_require__(1);
function activate(context) {
    (0, cppTestController_1.registerCppTestController)(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map