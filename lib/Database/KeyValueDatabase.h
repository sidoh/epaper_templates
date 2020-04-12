#include <stddef.h>
#include <stdlib.h>
#include <FS.h>

#pragma once

class KeyValueDatabase {
public:
  static const uint8_t NEW_ROW_PADDING = 10;
  static const uint8_t MAX_COLUMN_SIZE = 255;
  static const uint8_t HEADER_SIZE = 16;

  KeyValueDatabase();

  void open(File db);

  /**
   * Find the value corresponding to the provided key and copy it into the provided buffer.
   *
   * @param key
   * @param keyLength
   * @param valueBuffer
   * @param valueBufferLen
   * @return bool true iff the row is found
   */
  bool get(const char* key, size_t keyLength, char* valueBuffer, size_t valueBufferLen);

  /**
   * Upsert the value corresponding to the provided key
   *
   * @param key
   * @param keyLength
   * @param value
   * @param valueLength
   * @return bool true iff the row is found
   */
  void set(const char* key, size_t keyLength, const char* value, size_t valueLength);

  /**
   * Remove the row corresponding to the provided key from the database
   *
   * @param key
   * @param keyLength
   * @return bool true iff if the row is found
   */
  void erase(const char* key, size_t keyLength);

  /**
   * Return the number of keys in the database
   *
   * @return uint32_t
   */
  uint32_t size();

  /**
   * Reset scan pointer to the beginning of the database
   *
   */
  void beginRead();

  /**
   * Read a key and value pair.
   *
   * @return bool Return true iff there are more keys to read
   */
  bool readEntry(char* key, size_t keyLength, char* value, size_t valueLength);

  /**
   * Skip over N entries
   *
   * @return bool if successful
   */
  bool skipRead(size_t count);

private:
  /**
   * Writes a row with the given key and value.  Assumes that the file pointer is in the appropriate position.
   *
   * @param key
   * @param keyLength
   * @param value
   * @param valueLength
   * @param rowLength
   */
  void writeRow(const char* key, size_t keyLength, const char* value, size_t valueLength, size_t rowLength);

  /**
   * Seeks to the row with the provided key and returns the size of the row.  If no such row is found, 0 is
   * returned and the pointer will be at EOF.
   *
   * Pointer will be at the beginning of the value cell rather than the beginning of the row.
   *
   * @param key
   * @param keyLength
   * @return size_t length of the row, or 0 if not found
   */
  size_t seekToRow(const char* key, size_t keyLength);

  /**
   * Finds the first empty row with size >= rowLength.  If no such row is found, append a new one to the end
   * of the database.
   *
   * @param rowLength
   * @return size_t length of the found or created row
   */
  size_t seekToEmptyRow(size_t rowLength);

  uint32_t readUint32();
  void writeUint32(uint32_t val);

  void readColumn(char* buffer, size_t bufferLength);

  void flushSize();
  void readSize();

  File db;
  uint32_t _size;
};