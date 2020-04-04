#!/usr/bin/env ruby

=begin
Prints a raw bitmap to the terminal in ASCII form
=end

width, height, file = ARGV
data = File.read(file)
width = width.to_i
height = height.to_i

r = 0

data.bytes.each do |b|
  (0...8).each do |i|
    r += 1
    if ((b >> (7 - i)) & 1) == 1
      print "X "
    else
      print "  "
    end
    if r == width
      puts
      r = 0
    end
  end
end
