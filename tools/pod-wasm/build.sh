#!/usr/bin/env bash
# Builds public/pod/pod.wasm from the iPOD firmware's display code. Needs clang and wasm-ld (LLVM 15+).
# Usage: tools/pod-wasm/build.sh [path/to/iPOD]   (default: ../iPOD next to this repo)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
ipod="$(cd "${1:-$repo/../iPOD}" && pwd)"
sdk="$ipod/sdk"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

python3 "$here/transform.py" "$sdk/common/pod_display.c" "$work/pod_display_step.c"

flags=(--target=wasm32 -O2 -nostdlib -ffreestanding -fno-builtin-printf -w
       -I"$here/libc" -I"$here/stub" -I"$sdk/common" -I"$sdk/third_party/tjpgd" -I"$work")
objs=()
for src in "$here/pod_web.c" "$here/libc/libc.c" "$sdk/common/pod_gfx.c" "$sdk/common/pod_fonts.c" \
           "$sdk/common/pod_logo.c" "$sdk/third_party/tjpgd/tjpgd.c"; do
  obj="$work/$(basename "$src" .c).o"
  clang "${flags[@]}" -c "$src" -o "$obj"
  objs+=("$obj")
done
mkdir -p "$repo/public/pod"
wasm-ld --no-entry --strip-all --export-dynamic --initial-memory=4194304 \
  -o "$repo/public/pod/pod.wasm" "${objs[@]}"
echo "public/pod/pod.wasm: $(wc -c < "$repo/public/pod/pod.wasm") bytes, from iPOD $(git -C "$ipod" rev-parse --short HEAD)"
