# Tags decorator (used by tests below)

class Object
  def self.method_added(method_name)
    if @pending_tags
      @test_tags ||= {}
      @test_tags[method_name] = @pending_tags
      @pending_tags = nil
    end
  end

  def self.test_tags
    @test_tags
  end

  def self.tags(*tags)
    @pending_tags = tags
  end

  def tags(*tags)
    Object.tags(*tags)
  end
end

# Example tests:

tags :hello, :world
def test_should_pass
  raise unless 1 == 1
end

tags :hello, :foo
def test_should_fail
  raise unless 1 == 2
end

# Example test framework:

Test = Struct.new(:name, :block, :line, :file, :tags)

def run_test_framework
  tests = []

  # Find the tests in the global scope
  self.private_methods.grep(/^test_/).each do |method|
    file = self.method(method).source_location.first
    line = self.method(method).source_location.last
    tags = Object.test_tags[method] || []
    tests << Test.new(method, self.method(method), line, file, tags)
  end

  # Handling command-line arguments
  case ARGV.length
  when 0
    # Run all tests
    tests.each { |test| run_test(test) }
  when 1
    if ARGV[0] == '--list'
      # List all tests
      tests.each { |test| puts "#{test.file}|#{test.line}|#{test.name}|#{test.tags.join(',')}" }
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

  0
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
