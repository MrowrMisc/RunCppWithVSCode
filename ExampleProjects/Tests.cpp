#define SPEC_FILE Foo

#include "TestFramework.h"

Setup { std::cout << "Outer Setup" << std::endl; }

Describe("Something") {
    Setup { std::cout << "Inner Setup" << std::endl; }
    Test("Test 1") {
        //
        throw "Kaboom!!!!";
    }

    Describe("Nested Describe") {
        Test("Test 2") {}
        Test("Test 3") {}
    }
    End

    Test("Another Test") {}
}
End
