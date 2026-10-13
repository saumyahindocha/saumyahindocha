#pragma once
#include <stdint.h>
#include <stdbool.h>
typedef struct { uint16_t x, y, z; } xpt2046_raw_t;
void xpt2046_init(void);
bool xpt2046_irq_active(void);
bool xpt2046_read(xpt2046_raw_t *o);
