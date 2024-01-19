# Tags decorator (used by tests below)

def tags(*args):
    def decorator(func):
        func.tags = list(args)
        return func
    return decorator

# Examples test:

@tags("hello", "world")
def test_should_pass():
    assert 1 == 1

@tags("hello", "foo")
def test_should_fail():
    x = 69
    assert 1 == 2

# Example test framework:
    
import sys
import types
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Test:
    name: str
    func: callable
    line: int
    file: str
    tags: list[str]

    def run(self) -> bool:
        try:
            self.func()
            print(f"Test {self.name} passed")
            return True
        except:
            print(f"Test {self.name} failed")
            return False

def run_test_framework():
    tests: list[Test] = []

    # Find the tests in this file
    for name, obj in globals().items():
        if isinstance(obj, types.FunctionType) and name.startswith("test_"):
            absolute_filepath = Path(obj.__code__.co_filename)
            relative_filepath = absolute_filepath.relative_to(Path(__file__).parent)
            test_tags = getattr(obj, 'tags', [])
            tests.append(Test(name, obj, obj.__code__.co_firstlineno, str(relative_filepath), test_tags))

    # python PythonExample.py --list
    if len(sys.argv) == 2 and sys.argv[1] == "--list":
        for test in tests:
            print(f"{test.file}|{test.line}|{','.join(test.tags)}|{test.name}")

    # python PythonExample.py [file name] [line number] --> find and run the test on that line
    elif len(sys.argv) == 3:
        try:
            line = int(sys.argv[2])
        except ValueError:
            print(f"Invalid argument: {sys.argv[2]}")
            return

        for test in tests:
            if test.line == line and test.file.lower() == sys.argv[1].lower():
                return 0 if test.run() else 1 

        print(f"No test found on line {line} in file {sys.argv[1]}")

    # python PythonExample.py --> run all tests
    elif len(sys.argv) == 1:
        for test in tests:
            test.run()

    else:
        print("Usage: python PythonExample.py [--list] [line number]")
        print("  --list: list all tests, including name and line number")
        print("  line number: run the test on that line number")

if __name__ == "__main__":
    exit(run_test_framework())
