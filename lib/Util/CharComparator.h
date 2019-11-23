#include <cstring>

#pragma once

#ifndef _CHAR_COMPARATOR_H
#define _CHAR_COMPARATOR_H

struct cmp_str {
  bool operator()(char const *a, char const *b) const {
      return std::strcmp(a, b) < 0;
  }
};

#endif