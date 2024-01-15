#define SPEC_GROUP Tests2

#include "TestFramework.h"

Test("Test 1") { throw "Kaboom!"; }

TestGroup("xxBar");

Test("xxTest 2") {}
Test("xxTest 3") {}

End;

TestGroup("Child again");

Test("xxHERE") {}

Test("xxOUTSIDE") {}