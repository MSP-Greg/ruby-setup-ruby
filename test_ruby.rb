# frozen_string_literal: true

exit_val = 0

def test(t_name, wid = nil)
  begin
    # result is [good, bad]
    good, bad = yield

    if bad.nil?
      if wid
        puts "✅ passed  #{t_name.ljust wid}#{good}"
      else
        puts "✅ passed  #{t_name} #{good}"
      end
    else
      exit_val = 1
      bad = bad.join("\n           ") if Array === bad
      puts "❌ failed  #{t_name}\n           #{bad}", ''
    end
  rescue => e
    exit_val = 1
    puts "❌ failed  #{t_name}\n           #{e.message}", ''
  end
end

puts RUBY_DESCRIPTION

puts ''

if ARGV.length == 3
  test 'CLI bundler', 15 do
    temp = ARGV[0]
    if temp =~ /Bundler version \d+\.\d+\.\d+/
      temp.split(' ').last
    else
      [nil, '']
    end
  end

  test 'CLI gem', 15 do
    temp = ARGV[1]
    if temp =~ /\A\d+\.\d+\.\d+/
      [temp, nil]
    else
      [nil, '']
    end
  end

  test 'CLI rake', 15 do
    temp = ARGV[2]
    if temp =~ /rake, version \d+\.\d+\.\d+/
      [temp.split(' ').last, nil]
    else
      [nil, '']
    end
  end

  puts ''
end

test 'Gem.path.length == 2' do
  if Gem.path.length == 2
    ['', nil]
  else
    [nil, "Gem.path.length is #{Gem.path.length}"]
  end
end

test 'Gem.user_dir is within Dir.home' do
  # jruby 9.1 mixes slashes and backslashes
  if Gem.user_dir.gsub("\\", "/").start_with?(Dir.home.gsub "\\", "/")
    ['', nil]
  else
    [nil, ["Gem.user_dir should be a sub-directory of Dir.home",
     "Dir.home     #{Dir.home}",
     "Gem.user_dir #{Gem.user_dir}"]
    ]
  end
end

puts ''

test 'OpenSSL::OPENSSL_LIBRARY_VERSION', 35 do
  require 'openssl'
  OpenSSL::OPENSSL_LIBRARY_VERSION
end

test 'URI.open ssl' do
  uri = 'https://raw.githubusercontent.com/ruby/setup-ruby/master/LICENSE'
  start = 'MIT License'
  str = ''
  require 'open-uri'
  URI.send(:open, uri) { |f| str = f.read(128) }
  if str.start_with? start
    ['', nil]
  else
    [nil, '']
  end
end

unless RUBY_DESCRIPTION.start_with? 'jruby'
  puts ''
  sys_gcc = begin
    %x{gcc --version}.lines.first
  rescue
    'unknown'
  end
  puts "system compiler: #{sys_gcc}"
  puts "build compiler:  #{RbConfig::CONFIG.fetch('CC_VERSION_MESSAGE', 'unknown').lines.first}"
  puts "CPPFLAGS:\n#{RbConfig::CONFIG.fetch 'CPPFLAGS', 'unknown'}"
end

puts ''
# puts ENV['PATH'].gsub(File::PATH_SEPARATOR, "\n"), ''

exit exit_val
