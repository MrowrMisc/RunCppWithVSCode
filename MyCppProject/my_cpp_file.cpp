#include <iostream>

#define Test(...)

Test("Something");

Test("Something Else");

//////////////////////////////////////////
int main(int argc, char* argv[]) {
    // Print out all arguments:
    for (int i = 0; i < argc; ++i) std::cout << "Argument " << i << " = " << argv[i] << "\n";

    return 0;
}
