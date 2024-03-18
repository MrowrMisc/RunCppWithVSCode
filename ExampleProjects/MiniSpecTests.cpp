#define SPEC_GROUP MiniSpecTests

#include <MiniSpecs.h>
#include <MiniSpecs/Main.h>

Test("Passing test") {
    // passed
}

// Hello
//
// dsfdsfdsfds
Test("Failing test") { throw "KABOOM!\n\nExpected: foo\nGot: BARRRRR"; }