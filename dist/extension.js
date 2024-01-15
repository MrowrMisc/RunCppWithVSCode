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
exports.registerCppTestController = void 0;
const vscode = __importStar(__webpack_require__(2));
const runCppOutputChannel_1 = __webpack_require__(3);
const testRunner_1 = __webpack_require__(4);
const specsConfigFile_1 = __webpack_require__(6);
const cppTestController = vscode.tests.createTestController("cppTestController", "C++ Tests");
function registerCppTestController(context) {
    context.subscriptions.push(cppTestController);
}
exports.registerCppTestController = registerCppTestController;
async function discover() {
    const existingTestIds = new Set();
    cppTestController.items.forEach((test) => {
        existingTestIds.add(test.id);
    });
    const tests = await (0, testRunner_1.discoverTests)();
    if (!tests) {
        vscode.window.showErrorMessage("Failed to discover tests");
        cppTestController.items.forEach((test) => {
            cppTestController.items.delete(test.id);
        });
        return;
    }
    runCppOutputChannel_1.runCppOutputChannel.appendLine(`Discovered ${tests.length} tests`);
    const discoveredTestIds = new Set();
    tests.forEach((test) => {
        const id = `${test.filename}:${test.linenumber}`;
        discoveredTestIds.add(id);
        const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, test.filename);
        const vscodeTest = cppTestController.createTestItem(id, test.description, vscode.Uri.file(filePath.fsPath));
        vscodeTest.range = new vscode.Range(new vscode.Position(test.linenumber - 1, 0), new vscode.Position(test.linenumber - 1, 0));
        cppTestController.items.add(vscodeTest);
    });
    existingTestIds.forEach((id) => {
        if (!discoveredTestIds.has(id))
            cppTestController.items.delete(id);
    });
}
cppTestController.resolveHandler = async (test) => {
    if (test) {
        runCppOutputChannel_1.runCppOutputChannel.appendLine(`ResolveHandler called for ${test.id}`);
    }
    else {
        runCppOutputChannel_1.runCppOutputChannel.appendLine("ResolveHandler called for the first time");
        await discover();
    }
};
cppTestController.refreshHandler = async () => {
    await (0, testRunner_1.buildTestsProject)();
    await discover();
};
async function runHandler(debug, request, token) {
    if (debug) {
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
        await (0, testRunner_1.buildTestsProject)();
        await (0, testRunner_1.debugTest)(filename, parseInt(linenumber));
        return;
    }
    const run = cppTestController.createTestRun(request);
    await (0, testRunner_1.buildTestsProject)();
    const testsToRun = [];
    if (request.include)
        request.include.forEach((test) => {
            testsToRun.push(test);
        });
    else
        cppTestController.items.forEach((test) => {
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
        const testResult = await (0, testRunner_1.runTest)(filename, parseInt(linenumber), debug);
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
cppTestController.createRunProfile("Run", vscode.TestRunProfileKind.Run, (request, token) => {
    runHandler(false, request, token);
}, true);
(0, specsConfigFile_1.getSpecsConfig)().then((config) => {
    if (config?.debugCommand)
        cppTestController.createRunProfile("Debug", vscode.TestRunProfileKind.Debug, (request, token) => {
            runHandler(true, request, token);
        }, true);
});


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
exports.discoverTests = exports.debugTest = exports.runTest = exports.buildTestsProject = void 0;
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
        if (!specsConfig?.runCommand) {
            vscode.window.showErrorMessage("No run command specified in specs.json");
            return;
        }
        let testResult = new TestResult();
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
        const specsConfig = await (0, specsConfigFile_1.getSpecsConfig)();
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
async function runTest(filePath, lineNumber, debug = false) {
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