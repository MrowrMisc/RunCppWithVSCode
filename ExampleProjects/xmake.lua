add_rules("mode.debug", "mode.release")

if not is_plat("windows") then
    add_rules("plugin.compile_commands.autoupdate", { outputdir = "compile_commands" })
end

set_languages("cxx11")

add_repositories("MrowrLib https://github.com/MrowrLib/Packages.git")

add_requires("minispecs")

target("Tests")
    set_kind("binary")
    add_files("main.cpp")
    add_files("Tests.cpp")

target("MiniSpecTests")
    set_kind("binary")
    add_files("MiniSpecTests.cpp")
    add_packages("minispecs")
