#pragma once

#include <functional>
#include <optional>
#include <string>
#include <unordered_map>

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

    std::optional<TestInfo> find_test(const std::string& filename, unsigned int line) {
        auto file = _tests.find(filename);
        if (file == _tests.end()) return std::nullopt;
        auto line_number = file->second.find(line);
        if (line_number == file->second.end()) return std::nullopt;
        return line_number->second;
    }
};
