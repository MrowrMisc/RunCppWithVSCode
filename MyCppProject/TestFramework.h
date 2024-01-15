#pragma once

#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

struct TestFramework {
    struct TestGroup;
    struct TestInfo {
        TestGroup*            group;
        std::string           description;
        std::string           filename;
        unsigned int          line_number;
        std::function<void()> fn;
        std::string           full_description() const {
            if (group && !group->is_root()) return group->full_description() + " > " + description;
            else return description;
        }
    };

    struct TestGroup {
        TestGroup*                              parent = nullptr;
        std::string                             description;
        std::vector<std::unique_ptr<TestGroup>> groups;
        std::vector<std::unique_ptr<TestInfo>>  tests;
        TestGroup() = default;
        TestGroup(TestGroup* parent, const std::string& description)
            : parent(parent), description(description) {}
        bool        is_root() const { return parent == nullptr; }
        std::string full_description() const {
            if (parent) return parent->full_description() + " > " + description;
            else return description;
        }
    };

    class TestRegistry {
        std::vector<std::unique_ptr<TestGroup>> _group_storage;
        std::vector<TestGroup*>                 _group_stack;

        // Map filename => line number => TestInfo*
        std::unordered_map<std::string, std::unordered_map<unsigned int, TestInfo*>> _tests;

    public:
        static TestRegistry& instance() {
            static TestRegistry instance;
            return instance;
        }

        std::unordered_map<std::string, std::unordered_map<unsigned int, TestInfo*>>& tests() {
            return _tests;
        }

        TestGroup* current_group() {
            if (_group_stack.empty()) {
                _group_storage.emplace_back(new TestGroup());
                _group_stack.push_back(_group_storage.back().get());
            }
            return _group_stack.back();
        }

        void add_test(
            const std::string& description, const std::string& filename, unsigned int line,
            std::function<void()> fn
        ) {
            auto* test = new TestInfo{current_group(), description, filename, line, fn};
            current_group()->tests.emplace_back(test);
            _tests[filename][line] = test;
        }

        void define_group(const std::string& description, bool root = false) {
            auto* newGroup = new TestGroup(root ? nullptr : current_group(), description);
            _group_storage.emplace_back(newGroup);
            if (root) _group_stack = {newGroup};
            else _group_stack.push_back(newGroup);
        }

        void pop_group() {
            if (_group_stack.size() == 1) return;
            _group_stack.pop_back();
        }

        TestInfo* find_test(const std::string& filename, unsigned int line) {
            auto file = _tests.find(filename);
            if (file == _tests.end()) return nullptr;
            auto line_number = file->second.find(line);
            if (line_number == file->second.end()) return nullptr;
            return line_number->second;
        }
    };

    struct FunctionRunner {
        FunctionRunner(std::function<void()> f) { f(); }
    };

    static void ForEachTest(std::function<void(TestInfo*)> f) {
        auto& testRegistry = TestFramework::TestRegistry::instance();
        for (const auto& filename_fileTests : testRegistry.tests()) {
            for (const auto& lineNumber_test : filename_fileTests.second) {
                f(lineNumber_test.second);
            }
        }
    }

    static void RunTest(TestInfo* test) {
        try {
            test->fn();
        } catch (const std::exception& e) {
            std::cout << test->filename << ":" << test->line_number << ": " << e.what()
                      << std::endl;
        } catch (const char* e) {
            std::cout << test->filename << ":" << test->line_number << ": " << e << std::endl;
        } catch (...) {
            std::cout << test->filename << ":" << test->line_number << ": unknown exception"
                      << std::endl;
        }
    }

    static int RunTests(int argc, char* argv[]) {
        auto& testRegistry = TestFramework::TestRegistry::instance();

        if (argc == 1) {
            // Run all tests
            ForEachTest([](TestInfo* test) {
                std::cout << test->full_description() << std::endl;
                RunTest(test);
            });
            return 0;
        }

        if (argc == 2 && std::string(argv[1]) == "--list") {
            // List all tests (and their file name and line number)
            ForEachTest([](TestInfo* test) {
                std::cout << test->filename << ":" << test->line_number << ": "
                          << test->full_description() << std::endl;
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
        RunTest(test);

        return 0;
    }
};

#define __MicroSpec_Concat_Core(x, y) x##y
#define __MicroSpec_Concat(x, y) __MicroSpec_Concat_Core(x, y)
#define __MicroSpec_Stringify_Core(x) #x
#define __MicroSpec_Stringify(x) __MicroSpec_Stringify_Core(x)

#define _MicroSpec_UniqueSymbol_(prefix, count) \
    __MicroSpec_Concat(prefix, __MicroSpec_Concat(_MicroSpec_CompilationUnit_, count))

#define _MicroSpec_AddTest_(description, filename, linenumber, count)                \
    void                          _MicroSpec_UniqueSymbol_(Test, count)();           \
    TestFramework::FunctionRunner _MicroSpec_UniqueSymbol_(TestRunner, count)([] {   \
        TestFramework::TestRegistry::instance().add_test(                            \
            description, filename, linenumber, _MicroSpec_UniqueSymbol_(Test, count) \
        );                                                                           \
    });                                                                              \
    void                          _MicroSpec_UniqueSymbol_(Test, count)()

#define _MicroSpec_RunCode_(symbol, code)                         \
    TestFramework::FunctionRunner _MicroSpec_UniqueSymbol_(       \
        symbol, _MicroSpec_UniqueSymbol_(TestRunner, __COUNTER__) \
    )([] { code; })

#define Test(description) _MicroSpec_AddTest_(description, __FILE__, __LINE__, __COUNTER__)
#define TestGroup(description)                                                                   \
    _MicroSpec_RunCode_(                                                                         \
        _MicroSpec_TestGroup_, TestFramework::TestRegistry::instance().define_group(description) \
    )
#define EndTestGroup()                                                                \
    _MicroSpec_RunCode_(                                                              \
        _MicroSpec_EndTestGroup_, TestFramework::TestRegistry::instance().pop_group() \
    )
#define Describe(description) \
    TestGroup(description);   \
    namespace
#define End \
    _MicroSpec_RunCode_(_MicroSpec_End_, TestFramework::TestRegistry::instance().pop_group());

#ifdef SPEC_FILE
    #define _MicroSpec_CompilationUnit_ SPEC_FILE
#elif defined(SPEC_GROUP)
    #define _MicroSpec_CompilationUnit_ SPEC_GROUP
// clang-format off
_MicroSpec_RunCode_(_MicroSpec_TopLevelTestGroup_, TestFramework::TestRegistry::instance().define_group(__MicroSpec_Stringify(SPEC_GROUP), true));
// clang-format on
#elif !defined(_MicroSpec_CompilationUnit_)
    #define _MicroSpec_CompilationUnit_ _DefaultFile_
#endif