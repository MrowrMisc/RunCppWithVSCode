export enum TestComponentType {
    Test,
    TestGroup,
}

export interface ITestComponent {
    suiteId: string | undefined;
    type: TestComponentType;
    description: string;
    group: TestGroup | undefined;
    fullDescription(): string;
}

class TestComponent implements ITestComponent {
    public suiteId: string | undefined;
    public type = TestComponentType.Test;
    public description;
    public group;

    constructor(suiteId: string | undefined, description: string, group: TestGroup | undefined = undefined) {
        this.suiteId = suiteId;
        this.description = description;
        this.group = group;
    }

    public fullDescription(): string {
        if (this.group) return `${this.group.fullDescription()} > ${this.description}`;
        else return this.description;
    }
}

// Class TestGroup which inherits from TestComponent and additionally contains a list of children TestComponents
export class TestGroup extends TestComponent {
    public type = TestComponentType.TestGroup;
    public children: ITestComponent[] = [];
    constructor(
        suiteId: string | undefined = undefined,
        description: string = "",
        group: TestGroup | undefined = undefined,
    ) {
        super(suiteId, description, group);
    }
    isRootGroup(): boolean {
        return this.group === undefined;
    }
}

// Class Test which inherits from TestComponent and additionally contains a file path and line number
export class Test extends TestComponent {
    public filePath: string;
    public lineNumber: number;
    constructor(
        suiteId: string,
        description: string,
        filePath: string,
        lineNumber: number,
        group: TestGroup | undefined = undefined,
    ) {
        super(suiteId, description, group);
        this.filePath = filePath;
        this.lineNumber = lineNumber;
    }
}

export class TestResult {
    constructor(public testOutput: string = "", public testPassed: boolean = false) {}
}