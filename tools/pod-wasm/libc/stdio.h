#pragma once
// Minimal stdio for the wasm build: printf is silent, snprintf covers the formats the firmware uses.
#include <stddef.h>
#include <stdarg.h>
int vsnprintf(char *o, size_t n, const char *fmt, va_list ap);
int snprintf(char *o, size_t n, const char *fmt, ...);
static inline int printf(const char *fmt, ...) { (void)fmt; return 0; }
static inline int puts(const char *s) { (void)s; return 0; }
