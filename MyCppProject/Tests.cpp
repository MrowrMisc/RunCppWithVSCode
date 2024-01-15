#include <iostream>

#include "Entrypoint.h"  // IWYU pragma: keep
#include "TestMacro.h"

Test("Test 1") {
    std::cout << "Hello from Test 1" << std::endl;
    // throw "Kablamo!???";
    std::cout << "Hello from Test 1" << std::endl;
}

Test("Test 2??") {
    int x = 69;
    std::cout << "Hello from Test 2" << std::endl;
}

Test("Test 3?") { std::cout << "Hello from Test 3" << std::endl; }
