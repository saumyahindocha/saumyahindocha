import type { Status } from "@/lib/types";

const styles: Record<Status, string> = {
  Built: "border-brass/70 text-brass",
  "Pilot-ready": "border-brass/70 text-brass",
  "In progress": "border-sage/60 text-sage border-dashed",
};

/** Project status. Uses the brass accent or sage only; status colours stay inside sims. */
export function StatusChip({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-1.5 py-0.5 font-mono text-[0.6875rem] leading-4 tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}
