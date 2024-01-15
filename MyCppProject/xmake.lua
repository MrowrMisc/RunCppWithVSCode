add_rules("mode.debug", "mode.release")

target("Foo")
    set_kind("binary")
    add_files("*.cpp")
    set_languages("c++17")
