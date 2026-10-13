"""Turn the firmware's core-1 display loop into a function the browser can call once per frame.

On the Pod, core1_main() runs forever: read the mailbox, redraw, poll touch, sleep 5 ms.
A web page can't block, so this copies pod_display.c and rewrites only that function:
its loop-carried locals become statics, and the `while (true) { ... sleep_ms(5); }`
becomes the body of core1_step(). Everything else is the firmware's code, unchanged.
Fails loudly if the firmware's loop no longer has the expected shape.
"""
import re
import sys

src, out = sys.argv[1], sys.argv[2]
code = open(src, encoding="utf-8").read()

start = code.index("static void core1_main(void) {")
loop = code.index("    while (true) {\n", start)
tail = "        sleep_ms(5);\n    }\n}\n"
end = code.index(tail, loop)

head = code[start:loop]
locals_ = [l for l in head.splitlines()[1:] if l.strip() and not l.strip().startswith("flash_safe")]
for l in locals_:
    if not re.match(r"^    (uint32_t|bool|int) .*;$", l):
        sys.exit(f"transform.py: unexpected line before the core 1 loop: {l!r}")
statics = "\n".join("static " + l.strip() for l in locals_)

body = code[loop + len("    while (true) {\n") : end]
step = f"// ---- core1_main(), as one step per call (see tools/pod-wasm/transform.py)\n{statics}\nstatic void core1_step(void) {{\n{body}}}\nstatic void core1_main(void) {{}}\n"

open(out, "w", encoding="utf-8").write(code[:start] + step + code[end + len(tail) :])
print(f"core1_step: {len(locals_)} locals made static, {body.count(chr(10))} lines of loop body")
