#!/usr/bin/env ruby

require 'bindata'
require 'tempfile'
require 'hexdump'

MAX_KEY_SIZE = 255
VALUE_PADDING_FACTOR = 1.2
action, key, value = ARGV

class Database
  def initialize(file)
    @f = File.open(file, "rb+")
  end

  def self.open(file, &block)
    db = Database.new(file)
    begin
      yield(db)
    ensure
      db.close
    end
  end

  def self.open_tmp(&block)
    begin
      file = Tempfile.new('vardb')
      Database.open(file.path, &block)
    ensure
      File.delete(file) unless file.nil?
    end
  end

  def close
    @f.close
  end

  def get(key)
    row_size = find_row_by_key(key)

    if row_size
      @f.read(row_size - key.length).split("\x0").first
    end
  end

  def set(key, value)
    existing_row_size = find_row_by_key(key)
    new_row_size = key.length + value.length

    if existing_row_size.nil?
      capacity = find_empty_row(new_row_size)
      write_row(key, value, capacity)
    elsif existing_row_size < new_row_size
      # Clear this row by seeking to beginning and clearing the key
      @f.seek(-key.length-1, IO::SEEK_CUR)
      write_terminator()

      capacity = find_empty_row(new_row_size)
      write_row(key, value, capacity)
    else
      @f.write(value)
      write_terminator() unless existing_row_size == new_row_size
    end

    @f.flush
  end

  def write_row(key, value, max_row_len)
    key_len = BinData::Uint8.new(key.length)
    value_len = BinData::Uint8.new(max_row_len - key_len)

    key_len.write(@f)
    @f.write(key)

    value_len.write(@f)
    @f.write(value)
    write_terminator() if value_len > value.length
  end

  def find_row_by_key(key)
    @f.seek(0, IO::SEEK_SET)

    while !@f.eof?
      read_key_len = read_length()
      read_key = @f.read(read_key_len)
      read_value_length = read_length()

      if key == read_key
        return read_key_len + read_value_length
      end

      @f.seek(read_value_length, IO::SEEK_CUR)
    end

    return nil
  end

  def find_empty_row(min_size)
    @f.seek(0, IO::SEEK_SET)

    while !@f.eof?
      read_key_len = read_length()

      # Read first byte of key and skip over the rest
      key_start = read_byte()
      @f.seek(read_key_len-1, IO::SEEK_CUR) if read_key_len > 1

      read_value_len = read_length()
      capacity = read_key_len + read_value_len

      if key_start == 0 && capacity >= min_size
        @f.seek(-read_key_len-2, IO::SEEK_CUR)
        return capacity
      end

      # Skip over value
      @f.seek(read_value_len, IO::SEEK_CUR)
    end

    # We're at eof, meaning there wasn't an empty row.  We append a new one,
    # adding the padding size.
    row_capacity = (min_size * VALUE_PADDING_FACTOR).round

    # Will need to fill the row, as any padding bytes won't be filled otherwise
    write_blank(row_capacity+2)
    @f.seek(-row_capacity-2, IO::SEEK_CUR)

    return row_capacity
  end

  def dump
    pos = @f.pos
    @f.seek(0, IO::SEEK_SET)
    Hexdump.dump(@f)
    @f.seek(pos, IO::SEEK_SET)
  end

  def read_length
    read_byte()
  end

  def read_byte
    @f.read(1).bytes.first
  end

  def write_blank(n)
    n.times { write_terminator() }
  end

  def write_terminator
    BinData::Uint8.new(0).write(@f)
  end
end

# db = Database.new

# if action == "set"
#   db.set(key, value)
# elsif action == "get"
#   puts db.get(key)
# end

# db.close