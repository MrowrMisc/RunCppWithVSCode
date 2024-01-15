add_rules("mode.debug", "mode.release")

if not is_plat("windows") then
    add_rules("plugin.compile_commands.autoupdate", { outputdir = "compile_commands" })
end

target("Foo")
    set_kind("binary")
    add_files("*.cpp")
    set_languages("cxx11")
