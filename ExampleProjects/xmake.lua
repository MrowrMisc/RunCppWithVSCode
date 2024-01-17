add_rules("mode.debug", "mode.release")

if not is_plat("windows") then
    add_rules("plugin.compile_commands.autoupdate", { outputdir = "compile_commands" })
end

set_languages("cxx11")

target("Tests")
    set_kind("binary")
    add_files("main.cpp")
    add_files("Tests.cpp")
