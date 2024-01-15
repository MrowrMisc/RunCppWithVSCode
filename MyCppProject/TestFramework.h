#pragma once

#include <functional>
#include <iostream>
#include <string>
#include <unordered_map>

struct TestFramework {
    struct TestInfo {
        std::string           description;
        std::string           filename;
        unsigned int          line_number;
        std::function<void()> test;
    };

    class TestRegistry {
        // Map filename => line number => TestInfo
        std::unordered_map<std::string, std::unordered_map<unsigned int, TestInfo>> _tests;

    public:
        static TestRegistry& instance() {
            static TestRegistry instance;
            return instance;
        }

        void add_test(
            const std::string& description, const std::string& filename, unsigned int line,
            std::function<void()> test
        ) {
            _tests[filename][line] = TestInfo{description, filename, line, test};
        }

        std::unordered_map<std::string, std::unordered_map<unsigned int, TestInfo>>& tests() {
            return _tests;
        }

        TestInfo* find_test(const std::string& filename, unsigned int line) {
            auto file = _tests.find(filename);
            if (file == _tests.end()) return nullptr;
            auto line_number = file->second.find(line);
            if (line_number == file->second.end()) return nullptr;
            return &line_number->second;
        }
    };

    struct FunctionRunner {
        FunctionRunner(std::function<void()> f) { f(); }
    };

    static void ForEachTest(std::function<void(const TestInfo&)> f) {
        auto& testRegistry = TestFramework::TestRegistry::instance();
        for (const auto& filename_fileTests : testRegistry.tests()) {
            for (const auto& lineNumber_test : filename_fileTests.second) {
                f(lineNumber_test.second);
            }
        }
    }

    static void RunTest(const TestInfo& test) {
        try {
            test.test();
        } catch (const std::exception& e) {
            std::cout << test.filename << ":" << test.line_number << ": " << e.what() << std::endl;
        } catch (const char* e) {
            std::cout << test.filename << ":" << test.line_number << ": " << e << std::endl;
        } catch (...) {
            std::cout << test.filename << ":" << test.line_number << ": unknown exception"
                      << std::endl;
        }
    }

    static int RunTests(int argc, char* argv[]) {
        auto& testRegistry = TestFramework::TestRegistry::instance();

        if (argc == 1) {
            // Run all tests
            ForEachTest([](const TestInfo& test) {
                std::cout << test.description << std::endl;
                RunTest(test);
            });
            return 0;
        }

        if (argc == 2 && std::string(argv[1]) == "--list") {
            // List all tests (and their file name and line number)
            ForEachTest([](const TestInfo& test) {
                std::cout << test.filename << ":" << test.line_number << ": " << test.description
                          << std::endl;
            });
            return 0;
        }

        // Expected arguments: 0: 1: path to test file 2: line number of test
        if (argc != 3) {
            std::cout << "Invalid number of arguments" << std::endl;
            return 1;
        }

        auto filename   = std::string(argv[1]);
        auto lineNumber = std::stoi(argv[2]);

        // Find the test in the registry
        auto* test = testRegistry.find_test(filename, lineNumber);
        if (!test) {
            std::cout << "Test not found" << std::endl;
            return 1;
        }

        // Run the test
        RunTest(*test);

        return 0;
    }
};

#define _MicroSpec_Concat_Core_(x, y) x##y
#define _MicroSpec_Concat_(x, y) _MicroSpec_Concat_Core_(x, y)

#ifdef SPEC_FILE
    #define _MicroSpec_CompilationUnit_ SPEC_FILE
#elif !defined(_MicroSpec_CompilationUnit_)
    #define _MicroSpec_CompilationUnit_ _DefaultFile_
#endif

#define _MicroSpec_UniqueSymbol_(prefix, count) \
    _MicroSpec_Concat_(prefix, _MicroSpec_Concat_(_MicroSpec_CompilationUnit_, count))

#define _MicroSpec_AddTest_(description, filename, linenumber, count)                \
    void                          _MicroSpec_UniqueSymbol_(Test, count)();           \
    TestFramework::FunctionRunner _MicroSpec_UniqueSymbol_(TestRunner, count)([] {   \
        TestFramework::TestRegistry::instance().add_test(                            \
            description, filename, linenumber, _MicroSpec_UniqueSymbol_(Test, count) \
        );                                                                           \
    });                                                                              \
    void                          _MicroSpec_UniqueSymbol_(Test, count)()

#define Test(description) _MicroSpec_AddTest_(description, __FILE__, __LINE__, __COUNTER__)
