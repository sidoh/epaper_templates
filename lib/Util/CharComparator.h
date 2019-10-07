#include <cstring>

#pragma once

struct cmp_str {
  bool operator()(char const *a, char const *b) const {
      return std::strcmp(a, b) < 0;
  }
};