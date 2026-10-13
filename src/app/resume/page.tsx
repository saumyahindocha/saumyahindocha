import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resume" };

// Stage 1 stub. The HTML resume and build-time PDF arrive in stage 2.
export default function ResumePage() {
  return (
    <section className="mx-auto max-w-3xl px-5 pt-12 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Resume</h1>
      <p className="mt-4 text-sage">
        The full resume and PDF download are coming with the content stage.
      </p>
    </section>
  );
}
