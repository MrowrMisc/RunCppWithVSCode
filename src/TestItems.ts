import { TestItem } from "vscode";
import { ITestComponent } from "./TestTypes";

const testItemsToTestComponent = new WeakMap<TestItem, ITestComponent>();
const testComponentToTestItem = new WeakMap<ITestComponent, TestItem>();

export function testItemToTest(testItem: TestItem): ITestComponent {
    return testItemsToTestComponent.get(testItem)!;
}

export function testToTestItem(testComponent: ITestComponent): TestItem {
    return testComponentToTestItem.get(testComponent)!;
}

export function associateTestItemAndTest(testItem: TestItem, testComponent: ITestComponent) {
    testItemsToTestComponent.set(testItem, testComponent);
    testComponentToTestItem.set(testComponent, testItem);
}
