#pragma once

#include <functional>
#include <iostream>
#include <optional>
#include <string>
#include <unordered_map>

class TestRegistry {
    // Map filename => line number => test function
    std::unordered_map<std::string, std::unordered_map<unsigned int, std::function<void()>>> tests;

public:
    static TestRegistry& instance() {
        static TestRegistry instance;
        return instance;
    }

    void add_test(const std::string& filename, unsigned int line, std::function<void()> test) {
        tests[filename][line] = test;
    }

    std::optional<std::function<void()>> find_test(const std::string& filename, unsigned int line) {
        auto file = tests.find(filename);
        if (file == tests.end()) return std::nullopt;
        auto line_number = file->second.find(line);
        if (line_number == file->second.end()) return std::nullopt;
        return line_number->second;
    }
};
