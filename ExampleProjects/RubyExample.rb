# Example tests:

def test_should_pass
  raise unless 1 == 1
end

def test_should_fail
  raise unless 1 == 2
end

# Example test framework:

Test = Struct.new(:name, :block, :line, :file)

def run_test_framework
  tests = []

  # Find the tests in the global scope
  main_object = TOPLEVEL_BINDING.eval('self')
  main_object.private_methods.grep(/^test_/).each do |method|
    file = main_object.method(method).source_location.first
    line = main_object.method(method).source_location.last
    tests << Test.new(method, main_object.method(method), line, file)
  end

  # Handling command-line arguments
  case ARGV.length
  when 0
    # Run all tests
    tests.each { |test| run_test(test) }
  when 1
    if ARGV[0] == '--list'
      # List all tests
      tests.each { |test| puts "#{test.file}|#{test.line}|#{test.name}" }
    else
      puts "Usage: ruby #{__FILE__} [--list] [file name] [line number]"
    end
  when 2
    file, line = ARGV
    line = line.to_i
    test = tests.find { |t| t.file.downcase == file.downcase && t.line == line }
    if test
      return run_test(test) ? 0 : 1
    else
      puts "No test found on line #{line} in file #{file}"
    end
  else
    puts "Usage: ruby #{__FILE__} [--list] [file name] [line number]"
  end
end

def run_test(test)
  begin
    test.block.call
    puts "Test #{test.name} passed"
    true
  rescue
    puts "Test #{test.name} failed"
    false
  end
end

exit(run_test_framework) if __FILE__ == $PROGRAM_NAME
