#include <KeyValueDatabase.h>
#include <SPIFFS.h>

KeyValueDatabase::KeyValueDatabase() : _size(0) {}

void KeyValueDatabase::open(File db) {
  this->db = db;

  // Initialize if necessary
  if (!db.size()) {
    db.seek(0);
    for (size_t i = db.size(); i < HEADER_SIZE; ++i) {
      db.write(0);
    }
    db.flush();
  }

  readSize();
}

bool KeyValueDatabase::get(const char* key, size_t keyLength, char* valueBuffer, size_t valueBufferLen) {
  size_t rowSize = seekToRow(key, keyLength);

  if (! rowSize) {
    return false;
  }

  size_t valueSize = rowSize - keyLength;

  if (valueSize >= valueBufferLen) {
    return false;
  }

  db.read(reinterpret_cast<uint8_t*>(valueBuffer), valueSize);
  valueBuffer[valueSize] = 0;

  return true;
}

void KeyValueDatabase::set(const char* key, size_t keyLength, const char* value, size_t valueLength) {
  size_t existingRowSize = seekToRow(key, keyLength);
  size_t newRowSize = keyLength + valueLength;

  // True if there is no existing row (size == 0), or if the existing row isn't
  // big enough to accommodate the new value
  if (existingRowSize < newRowSize) {
    // If there was an existing row, clear it by setting the first byte of the
    // key to 0.
    if (existingRowSize) {
      db.seek(db.position() - keyLength - 1, SeekSet);
      db.write(0);
    } else {
      this->_size++;
      flushSize();
    }

    size_t capacity = seekToEmptyRow(newRowSize);
    writeRow(key, keyLength, value, valueLength, capacity);
  } else {
    db.write(reinterpret_cast<const uint8_t*>(value), valueLength);

    if (existingRowSize > newRowSize) {
      db.write(0);
    }
  }

  db.flush();
}

void KeyValueDatabase::erase(const char* key, size_t keyLength) {
  if (seekToRow(key, keyLength)) {
    db.seek(db.position() - keyLength - 1, SeekSet);
    db.write(0);

    this->_size--;
    flushSize();
  }

  db.flush();
}

void KeyValueDatabase::writeRow(const char* key, size_t keyLength, const char* value, size_t valueLength, size_t rowLength) {
  uint8_t valueColLength = rowLength - keyLength;

  db.write(keyLength);
  db.write(reinterpret_cast<const uint8_t*>(key), keyLength);

  db.write(valueColLength);
  db.write(reinterpret_cast<const uint8_t*>(value), valueLength);

  // null terminate if there's padding in the row
  if (valueColLength > valueLength) {
    db.write(0);
  }
}

size_t KeyValueDatabase::seekToRow(const char* key, size_t keyLength) {
  char buffer[keyLength+1];
  db.seek(HEADER_SIZE, SeekSet);

  while (db.available()) {
    uint8_t readKeyLength = db.read();
    db.read(reinterpret_cast<uint8_t*>(buffer), std::min(keyLength, static_cast<size_t>(readKeyLength)));

    // If only read part of the key, skip over the rest.
    if (keyLength < readKeyLength) {
      db.seek(readKeyLength - keyLength, SeekCur);
    }

    uint8_t readValueLength = db.read();

    if (0 == strncmp(buffer, key, keyLength)) {
      db.seek(0, SeekCur);
      return readKeyLength + readValueLength;
    }

    db.seek(readValueLength, SeekCur);
  }

  // not found
  return 0;
}

size_t KeyValueDatabase::seekToEmptyRow(size_t rowLength) {
  db.seek(HEADER_SIZE, SeekSet);

  while (db.available()) {
    uint8_t readKeyLen = db.read();

    // Only need to check if the first byte is cleared (== \x0) to know if
    // this is an empty row.  Read it and skip over the rest
    uint8_t keyStart = db.read();
    db.seek(readKeyLen-1, SeekCur);

    uint8_t readValueLen = db.read();
    uint8_t rowCapacity = readKeyLen + readValueLen;

    if (keyStart == 0 && rowCapacity > rowLength) {
      // Seek back to beginning of row
      db.seek(db.position() - readKeyLen - 2, SeekSet);
      return rowCapacity;
    }

    // Skip over value
    db.seek(readValueLen, SeekCur);
  }

  // If we get here, no suitable empty row was found.  So we append a new
  // one, adding padding size.
  uint8_t rowCapacity = rowLength + NEW_ROW_PADDING;

  // Fill the row to account for padding
  for (uint8_t i = 0; i < rowCapacity+2; ++i) {
    db.write(0);
  }
  db.flush();

  // Seek back to beginning of row
  db.seek(db.position() - rowCapacity - 2, SeekSet);

  return rowCapacity;
}

uint32_t KeyValueDatabase::readUint32() {
  uint32_t val = 0;

  for (int8_t i = 3; i >= 0; --i) {
    uint8_t byte = db.read();
    Serial.printf_P(PSTR("Read byte: %02X\n"), byte);
    val |= (byte << (i * 8));
  }

  return val;
}

void KeyValueDatabase::writeUint32(uint32_t val) {
  for (int8_t i = 3; i >= 0; --i) {
    uint8_t byte = ((val >> (i * 8)) & 0xFF);
    db.write(byte);
  }
}

void KeyValueDatabase::flushSize() {
  db.seek(4);
  writeUint32(_size);
  db.flush();
}

void KeyValueDatabase::readSize() {
  db.seek(4);
  this->_size = readUint32();
}

uint32_t KeyValueDatabase::size() {
  return this->_size;
}

void KeyValueDatabase::beginRead() {
  db.seek(HEADER_SIZE);
}


bool KeyValueDatabase::skipRead(size_t count) {
  for (size_t n = 0; n < count && db.available(); ++n) {
    for (size_t c = 0; c < 2; ++c) {
      uint8_t columnSize = db.read();
      db.seek(columnSize, SeekCur);
    }
  }

  return db.available();
}

bool KeyValueDatabase::readEntry(char* key, size_t keyLength, char* value, size_t valueLength) {
  while (db.available()) {
    readColumn(key, keyLength);
    readColumn(value, valueLength);

    if (key[0] != 0) {
      return true;
    }
  }

  return false;
}

void KeyValueDatabase::readColumn(char* buffer, size_t bufferLength) {
  uint8_t columnSize = db.read();
  size_t readSize = std::min(static_cast<size_t>(columnSize), bufferLength-1);
  size_t i;

  for (i = 0; i < readSize; ++i) {
    buffer[i] = db.read();

    if (buffer[i] == 0) {
      break;
    }
  }

  buffer[i] = 0;

  if (i < columnSize) {
    db.seek(columnSize - i - 1, SeekCur);
  }
}