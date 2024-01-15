#pragma once

#include <functional>

#include "TestRegistry.h"

struct FunctionRunner {
    FunctionRunner(std::function<void()> f) { f(); }
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
    void           _MicroSpec_UniqueSymbol_(Test, count)();                          \
    FunctionRunner _MicroSpec_UniqueSymbol_(TestRunner, count)([] {                  \
        TestRegistry::instance().add_test(                                           \
            description, filename, linenumber, _MicroSpec_UniqueSymbol_(Test, count) \
        );                                                                           \
    });                                                                              \
    void           _MicroSpec_UniqueSymbol_(Test, count)()

#define Test(description) _MicroSpec_AddTest_(description, __FILE__, __LINE__, __COUNTER__)
