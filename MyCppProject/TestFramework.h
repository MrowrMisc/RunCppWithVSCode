#pragma once

#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

struct TestFramework {
    struct TestGroup;
    struct SetupOrTeardown {
        TestGroup*            group;
        std::function<void()> fn;
    };
    struct TestInfo {
        TestGroup*            group;
        std::string           description;
        std::string           filename;
        unsigned int          line_number;
        std::function<void()> fn;
        std::string           full_description() const {
            if (group) return group->full_description() + " > " + description;
            else return description;
        }
    };
    struct TestGroup {
        TestGroup*                                    parent = nullptr;
        std::string                                   description;
        std::vector<std::unique_ptr<TestGroup>>       groups;
        std::vector<std::unique_ptr<TestInfo>>        tests;
        std::vector<std::unique_ptr<SetupOrTeardown>> setups;
        std::vector<std::unique_ptr<SetupOrTeardown>> teardowns;
        TestGroup() = default;
        TestGroup(TestGroup* parent, const std::string& description) : parent(parent), description(description) {}
        bool        is_root() const { return parent == nullptr; }
        std::string full_description() const {
            if (parent) return parent->full_description() + " > " + description;
            else return description;
        }
    };

    class TestRegistry {
        std::vector<std::unique_ptr<TestGroup>>                                      _group_storage;
        std::vector<TestGroup*>                                                      _group_stack;
        std::unordered_map<std::string, std::unordered_map<unsigned int, TestInfo*>> _tests;  // Map filename => line number => TestInfo*

    public:
        static TestRegistry& instance() {
            static TestRegistry instance;
            return instance;
        }

        std::unordered_map<std::string, std::unordered_map<unsigned int, TestInfo*>>& tests() { return _tests; }

        TestGroup* current_group() {
            if (_group_stack.empty()) {
                _group_storage.emplace_back(new TestGroup());
                _group_stack.push_back(_group_storage.back().get());
            }
            return _group_stack.back();
        }
        void add_test(const std::string& description, const std::string& filename, unsigned int line, std::function<void()> fn) {
            auto* test = new TestInfo{current_group(), description, filename, line, fn};
            current_group()->tests.emplace_back(test);
            _tests[filename][line] = test;
        }
        void add_setup(const std::string&, const std::string&, unsigned int, std::function<void()> fn) {
            current_group()->setups.emplace_back(new SetupOrTeardown{current_group(), fn});
        }
        void add_teardown(const std::string&, const std::string&, unsigned int, std::function<void()> fn) {
            current_group()->teardowns.emplace_back(new SetupOrTeardown({current_group(), fn}));
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
        for (const auto& filename_fileTests : testRegistry.tests())
            for (const auto& lineNumber_test : filename_fileTests.second) f(lineNumber_test.second);
    }

    // TODO run setups and teardowns. Let's have a RunGroup() with inner RunGroup() calls :)
    static bool RunTest(TestInfo* test) {
        try {
            test->fn();
            return true;
        } catch (const std::exception& e) {
            std::cout << test->filename << ":" << test->line_number << ": " << e.what() << std::endl;
        } catch (const char* e) {
            std::cout << test->filename << ":" << test->line_number << ": " << e << std::endl;
        } catch (...) {
            std::cout << test->filename << ":" << test->line_number << ": unknown exception" << std::endl;
        }
        return false;
    }

    static int RunTests(int argc, char* argv[]) {
        auto& testRegistry = TestFramework::TestRegistry::instance();
        if (argc == 1) {
            ForEachTest([](TestInfo* test) {
                std::cout << test->full_description() << std::endl;
                RunTest(test);
            });
            return 0;  // TODO return 1 if any failed
        } else if (argc == 2 && std::string(argv[1]) == "--list") {
            ForEachTest([](TestInfo* test) { std::cout << test->filename << ":" << test->line_number << ":" << test->full_description() << std::endl; });
            return 0;
        } else if (argc != 3) {
            std::cout << "Invalid number of arguments" << std::endl;
            return 1;
        }
        auto  filename   = std::string(argv[1]);
        auto  lineNumber = std::stoi(argv[2]);
        auto* test       = testRegistry.find_test(filename, lineNumber);
        if (!test) {
            std::cout << "Test not found" << std::endl;
            return 1;
        }
        return RunTest(test) ? 0 : 1;
    }
};

#define __MicroSpec_Concat_Core(x, y) x##y
#define __MicroSpec_Concat(x, y) __MicroSpec_Concat_Core(x, y)
#define __MicroSpec_Stringify_Core(x) #x
#define __MicroSpec_Stringify(x) __MicroSpec_Stringify_Core(x)
#define _MicroSpec_UniqueSymbol_(prefix, count) __MicroSpec_Concat(prefix, __MicroSpec_Concat(_MicroSpec_CompilationUnit_, count))
#define _MicroSpec_AddComponent_(adder, symbol, description, filename, linenumber, count)                                          \
    void                          _MicroSpec_UniqueSymbol_(symbol, count)();                                                       \
    TestFramework::FunctionRunner _MicroSpec_UniqueSymbol_(__MicroSpec_Concat(symbol, FunctionRunner), count)([] {                 \
        TestFramework::TestRegistry::instance().adder(description, filename, linenumber, _MicroSpec_UniqueSymbol_(symbol, count)); \
    });                                                                                                                            \
    void                          _MicroSpec_UniqueSymbol_(symbol, count)()
#define _MicroSpec_RunCode_(symbol, code) \
    TestFramework::FunctionRunner _MicroSpec_UniqueSymbol_(symbol, _MicroSpec_UniqueSymbol_(testManager, __COUNTER__))([] { code; })
#define Test(description) _MicroSpec_AddComponent_(add_test, _Test_, description, __FILE__, __LINE__, __COUNTER__)
#define Setup _MicroSpec_AddComponent_(add_setup, _Setup_, "", __FILE__, __LINE__, __COUNTER__)
#define Teardown _MicroSpec_AddComponent_(add_teardown, _Teardown_, "", __FILE__, __LINE__, __COUNTER__)
#define TestGroup(description) _MicroSpec_RunCode_(_MicroSpec_TestGroup_, TestFramework::TestRegistry::instance().define_group(description))
#define EndTestGroup() _MicroSpec_RunCode_(_MicroSpec_EndTestGroup_, TestFramework::TestRegistry::instance().pop_group())
#define Describe(description) \
    TestGroup(description);   \
    namespace
#define End _MicroSpec_RunCode_(_MicroSpec_End_, TestFramework::TestRegistry::instance().pop_group());
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