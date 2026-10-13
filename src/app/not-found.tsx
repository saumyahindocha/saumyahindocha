import Link from "next/link";
import { DimensionLine } from "@/components/bench/DimensionLine";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
      <DimensionLine label="nothing measured here" className="w-full max-w-lg" />
      <p className="mt-8 text-sage">This patch of the mat is empty.</p>
      <Link
        href="/"
        className="mt-4 text-sm text-ink underline decoration-brass/60 underline-offset-4 hover:decoration-brass"
      >
        Back to the bench
      </Link>
    </section>
  );
}
