// The few libc functions Pod's display code needs, for a freestanding wasm32 build.
#include <stdarg.h>
#include <stdint.h>
#include "stdio.h"
#include "string.h"
#include "strings.h"

void *memcpy(void *d, const void *s, size_t n) { uint8_t *o = d; const uint8_t *i = s; while (n--) *o++ = *i++; return d; }
void *memmove(void *d, const void *s, size_t n) {
    uint8_t *o = d; const uint8_t *i = s;
    if (o < i) while (n--) *o++ = *i++;
    else { o += n; i += n; while (n--) *--o = *--i; }
    return d;
}
void *memset(void *d, int c, size_t n) { uint8_t *o = d; while (n--) *o++ = (uint8_t)c; return d; }
int memcmp(const void *a, const void *b, size_t n) {
    const uint8_t *x = a, *y = b;
    for (; n--; x++, y++) if (*x != *y) return *x - *y;
    return 0;
}
size_t strlen(const char *s) { size_t n = 0; while (s[n]) n++; return n; }
char *strcpy(char *d, const char *s) { char *o = d; while ((*o++ = *s++)); return d; }
char *strncpy(char *d, const char *s, size_t n) {
    size_t i = 0;
    for (; i < n && s[i]; i++) d[i] = s[i];
    for (; i < n; i++) d[i] = 0;
    return d;
}
int strcmp(const char *a, const char *b) { while (*a && *a == *b) a++, b++; return (uint8_t)*a - (uint8_t)*b; }
char *strrchr(const char *s, int c) { const char *r = 0; do if (*s == (char)c) r = s; while (*s++); return (char *)r; }
static int lower(int c) { return c >= 'A' && c <= 'Z' ? c + 32 : c; }
int strcasecmp(const char *a, const char *b) {
    while (*a && lower((uint8_t)*a) == lower((uint8_t)*b)) a++, b++;
    return lower((uint8_t)*a) - lower((uint8_t)*b);
}

// %d %i %u %ld %lu %lld %llu %s %c %%, with optional '0' flag and width.
int vsnprintf(char *o, size_t n, const char *f, va_list ap) {
    size_t k = 0;
#define PUT(ch) do { if (k + 1 < n) o[k] = (ch); k++; } while (0)
    for (; *f; f++) {
        if (*f != '%') { PUT(*f); continue; }
        f++;
        char pad = ' ';
        if (*f == '0') { pad = '0'; f++; }
        int width = 0;
        while (*f >= '0' && *f <= '9') width = width * 10 + (*f++ - '0');
        int longs = 0;
        while (*f == 'l') { longs++; f++; }
        char buf[24]; int len = 0; const char *str = buf;
        if (*f == 'd' || *f == 'i' || *f == 'u') {
            unsigned long long v; int neg = 0;
            if (*f == 'u') v = longs >= 2 ? va_arg(ap, unsigned long long) : longs ? va_arg(ap, unsigned long) : va_arg(ap, unsigned);
            else {
                long long s = longs >= 2 ? va_arg(ap, long long) : longs ? va_arg(ap, long) : va_arg(ap, int);
                if (s < 0) { neg = 1; v = (unsigned long long)(-s); } else v = (unsigned long long)s;
            }
            char tmp[24]; int t = 0;
            do { tmp[t++] = (char)('0' + v % 10); v /= 10; } while (v);
            if (neg) tmp[t++] = '-';
            while (t) buf[len++] = tmp[--t];
        } else if (*f == 's') {
            str = va_arg(ap, const char *); if (!str) str = "(null)";
            len = (int)strlen(str);
        } else if (*f == 'c') {
            buf[len++] = (char)va_arg(ap, int);
        } else if (*f == '%') {
            buf[len++] = '%';
        } else if (!*f) break;
        for (int i = len; i < width; i++) PUT(pad);
        for (int i = 0; i < len; i++) PUT(str[i]);
    }
    if (n) o[k < n ? k : n - 1] = 0;
#undef PUT
    return (int)k;
}
int snprintf(char *o, size_t n, const char *f, ...) {
    va_list ap; va_start(ap, f);
    int r = vsnprintf(o, n, f, ap);
    va_end(ap);
    return r;
}

float fminf(float a, float b) { return a < b ? a : b; }
float fmaxf(float a, float b) { return a > b ? a : b; }
