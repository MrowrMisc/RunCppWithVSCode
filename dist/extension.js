/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
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
exports.registerTestCodeLens = void 0;
const vscode = __importStar(__webpack_require__(1));
const runTestCommand_1 = __webpack_require__(3);
class TestCodeLensProvider {
    provideCodeLenses(document) {
        const lenses = [];
        const regex = /^Test\("[^"]*"\)/;
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            if (line.text.match(regex)) {
                const range = new vscode.Range(i, 0, i, 0);
                const filepath = vscode.workspace.asRelativePath(document.uri.fsPath);
                const linenumber = i + 1;
                const command = {
                    title: "Run Test",
                    command: runTestCommand_1.runTestCommandId,
                    arguments: [filepath, linenumber],
                };
                lenses.push(new vscode.CodeLens(range, command));
            }
        }
        return lenses;
    }
}
function registerTestCodeLens(context) {
    const provider = new TestCodeLensProvider();
    context.subscriptions.push(vscode.languages.registerCodeLensProvider("cpp", provider));
}
exports.registerTestCodeLens = registerTestCodeLens;


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
exports.registerTestCommand = exports.runTestCommandId = void 0;
const vscode = __importStar(__webpack_require__(1));
const runCppOutputChannel_1 = __webpack_require__(4);
const xmakeTestRunner_1 = __webpack_require__(5);
exports.runTestCommandId = "coolextension.runtest";
// run test function with a string parameter for file path and a number parameter for line number:
async function runTest(filePath, lineNumber) {
    // Simply show a VS Code informational message with the parameters that were probvided:
    vscode.window.showInformationMessage(`Running test at ${filePath}:${lineNumber}`);
    runCppOutputChannel_1.runCppOutputChannel.appendLine(`Running test at ${filePath}:${lineNumber}`);
    runCppOutputChannel_1.runCppOutputChannel.show();
    // Let's actually run this and get a test result
    const testRunner = new xmakeTestRunner_1.XmakeTestRunner();
    const testResult = await testRunner.runTest(filePath, lineNumber);
    runCppOutputChannel_1.runCppOutputChannel.appendLine(`Test output: ${testResult.testOutput}`); // data.toString()}
    runCppOutputChannel_1.runCppOutputChannel.appendLine(`Test passed: ${testResult.testPassed}`);
}
function registerTestCommand(context) {
    let disposable = vscode.commands.registerCommand(exports.runTestCommandId, runTest);
    context.subscriptions.push(disposable);
}
exports.registerTestCommand = registerTestCommand;


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
exports.runCppOutputChannel = void 0;
const vscode = __importStar(__webpack_require__(1));
const runCppOutputChannelName = "Run C++ Stuff";
exports.runCppOutputChannel = vscode.window.createOutputChannel(runCppOutputChannelName);


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
exports.XmakeTestRunner = void 0;
const testRunner_1 = __webpack_require__(6);
const vscode = __importStar(__webpack_require__(1));
const child_process = __importStar(__webpack_require__(7));
class XmakeTestRunner {
    async runTest(filePath, lineNumber) {
        let testResult = new testRunner_1.TestResult();
        const command = `xmake run Tests "${filePath}" "${lineNumber}"`;
        const options = { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath };
        return new Promise((resolve, reject) => {
            const child = child_process.exec(command, options, (error) => {
                if (error) {
                    testResult.testOutput += error.message;
                    testResult.testPassed = false;
                    resolve(testResult);
                }
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
}
exports.XmakeTestRunner = XmakeTestRunner;


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestResult = void 0;
class TestResult {
    testOutput;
    testPassed;
    constructor(testOutput = "", testPassed = false) {
        this.testOutput = testOutput;
        this.testPassed = testPassed;
    }
}
exports.TestResult = TestResult;


/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("child_process");

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
const runTestCommand_1 = __webpack_require__(3);
const testMacroCodeLensProvider_1 = __webpack_require__(2);
function activate(context) {
    (0, runTestCommand_1.registerTestCommand)(context);
    (0, testMacroCodeLensProvider_1.registerTestCodeLens)(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map