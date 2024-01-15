#define SPEC_GROUP Tests1

#include "TestFramework.h"

Describe("Something") {
    Test("Test 1") { throw "Kaboom!"; }

    Describe("Nested Describe") {
        Test("Test 2") {}
        Test("Test 3") {}
    }
    End

    Test("Another Test") {}
}
End

Test("xxOUTSIDE") {}