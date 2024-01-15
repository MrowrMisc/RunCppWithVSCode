export class Test {
    constructor(public description: string, public filename: string, public linenumber: number) {}
}

export class TestResult {
    constructor(public testOutput: string = "", public testPassed: boolean = false) {}
}

export interface ITestAdapter {
    runTest(filePath: string, lineNumber: number): Promise<TestResult>;
    discoverTests(): Promise<Test[]>;
}
