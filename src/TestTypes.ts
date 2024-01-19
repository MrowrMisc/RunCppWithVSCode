export enum TestComponentType {
    Test,
    TestGroup,
}

export interface ITestComponent {
    suiteId: string;
    type: TestComponentType;
    description: string;
    group: TestGroup | undefined;
    fullDescription(): string;
}

class TestComponent implements ITestComponent {
    public suiteId: string;
    public type = TestComponentType.Test;
    public description;
    public group;

    constructor(suiteId: string, description: string, group: TestGroup | undefined = undefined) {
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
    constructor(suiteId: string, description: string = "", group: TestGroup | undefined = undefined) {
        super(suiteId, description, group);
    }
    isRootGroup(): boolean {
        return this.group === undefined;
    }
    identifier(): string {
        return `[GROUP]--${this.suiteId}--${this.description}`;
    }
}

// Class Test which inherits from TestComponent and additionally contains a file path and line number
export class Test extends TestComponent {
    public filePath: string;
    public lineNumber: number;
    public tags: string[] = [];
    constructor(
        suiteId: string,
        description: string,
        filePath: string, // TODO: allow undefined
        lineNumber: number, // TODO: allow undefined
        tags: string[] = [],
        group: TestGroup | undefined = undefined,
    ) {
        super(suiteId, description, group);
        this.filePath = filePath;
        this.lineNumber = lineNumber;
    }
    identifier(): string {
        return `${this.suiteId}--${this.filePath}--${this.lineNumber}--${this.description}`;
    }
}

export class TestResult {
    constructor(public testOutput: string = "", public testPassed: boolean = false) {}
}
