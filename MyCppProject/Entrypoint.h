#pragma once

#include <iostream>

#include "TestRegistry.h"

int main(int argc, char* argv[]) {
    if (argc == 1) {
        std::cout << "No arguments provided" << std::endl;
        return 1;
    }

    if (argc == 2 && std::string(argv[1]) == "--list") {
        auto& testRegistry = TestRegistry::instance();
        for (const auto& [filename, fileTests] : testRegistry.tests())
            for (const auto& [lineNumber, test] : fileTests)
                std::cout << filename << ":" << lineNumber << ":" << test.description << std::endl;
        return 0;
    }

    // Expected arguments:
    // 0:
    // 1: path to test file
    // 2: line number of test
    if (argc != 3) {
        std::cout << "Invalid number of arguments" << std::endl;
        return 1;
    }

    auto& testRegistry = TestRegistry::instance();

    auto filename   = std::string(argv[1]);
    auto lineNumber = std::stoi(argv[2]);

    // Find the test in the registry
    auto test = testRegistry.find_test(filename, lineNumber);

    if (!test) {
        std::cout << "Test not found" << std::endl;
        return 1;
    }

    // Run the test
    try {
        std::cout << "Running test [" << filename << ":" << lineNumber << "]" << std::endl;
        test.value().test();
    } catch (const std::exception& e) {
        std::cout << "Test failed: " << e.what() << std::endl;
        return 1;
    } catch (const char* e) {
        std::cout << "Test failed: " << e << std::endl;
        return 1;
    } catch (...) {
        std::cout << "Test failed: unknown exception" << std::endl;
        return 1;
    }

    return 0;
}
