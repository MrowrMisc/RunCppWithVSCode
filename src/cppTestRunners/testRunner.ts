export class TestResult {
    constructor(public testOutput: string = "", public testPassed: boolean = false) {}
}

export interface ITestRunner {
    runTest(filePath: string, lineNumber: number): Promise<TestResult>;
}
