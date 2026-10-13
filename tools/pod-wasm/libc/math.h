#pragma once
// Each macro compiles to a single wasm instruction; fminf/fmaxf live in libc.c.
#define floorf __builtin_floorf
#define ceilf __builtin_ceilf
#define sqrtf __builtin_sqrtf
float fminf(float a, float b);
float fmaxf(float a, float b);
#define fabsf __builtin_fabsf
#define roundf __builtin_roundf
#define truncf __builtin_truncf
