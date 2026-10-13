// Builds public/saumya-hindocha-resume.pdf from the same content as /resume (runs before `next build`).
// Unlike the web page, the PDF includes `pdfOnly` lines such as the CPI.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import matter from "gray-matter";
import React from "react";
import {
  Document,
  Font,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToFile,
} from "@react-pdf/renderer";

const require = createRequire(import.meta.url);
const root = process.cwd();
const resume = JSON.parse(fs.readFileSync(path.join(root, "content/resume.json"), "utf8"));
const projects = fs
  .readdirSync(path.join(root, "content/projects"))
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => matter(fs.readFileSync(path.join(root, "content/projects", f), "utf8")).data)
  .sort((a, b) => a.code.localeCompare(b.code));

const font = (pkg, file) => require.resolve(`@fontsource/${pkg}/files/${file}`);
Font.register({
  family: "Manrope",
  fonts: [
    { src: font("manrope", "manrope-latin-400-normal.woff"), fontWeight: 400 },
    { src: font("manrope", "manrope-latin-600-normal.woff"), fontWeight: 600 },
  ],
});
Font.register({
  family: "JetBrains Mono",
  src: font("jetbrains-mono", "jetbrains-mono-latin-400-normal.woff"),
});
Font.registerHyphenationCallback((w) => [w]);

// Print palette: ink on paper, with the site's mat green and brass as the only colours.
const INK = "#16241d";
const MUTED = "#4a5d52";
const GREEN = "#1d4b39";
const BRASS = "#a87a3d";

const s = StyleSheet.create({
  page: { fontFamily: "Manrope", fontSize: 9.5, color: INK, padding: "36 42", lineHeight: 1.45 },
  name: { fontSize: 22, fontWeight: 600, color: GREEN, letterSpacing: -0.4, lineHeight: 1.15 },
  position: { fontFamily: "JetBrains Mono", fontSize: 9, color: BRASS, marginTop: 2 },
  contact: { flexDirection: "row", gap: 14, marginTop: 6, fontSize: 8.5, color: MUTED },
  link: { color: MUTED, textDecoration: "none" },
  section: { flexDirection: "row", borderTop: `0.6 solid #c9d2cc`, paddingTop: 8, marginTop: 10 },
  label: {
    width: 92,
    fontFamily: "JetBrains Mono",
    fontSize: 7.5,
    letterSpacing: 1,
    color: MUTED,
    textTransform: "uppercase",
    paddingTop: 1.5,
  },
  body: { flex: 1, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  title: { fontWeight: 600 },
  when: { fontFamily: "JetBrains Mono", fontSize: 7.5, color: MUTED },
  line: { color: MUTED },
  ctx: { fontFamily: "JetBrains Mono", fontSize: 7.5, color: BRASS },
  nums: { fontFamily: "JetBrains Mono", fontSize: 7.5, color: MUTED, marginTop: 1 },
});

const h = React.createElement;
const Section = (title, ...children) =>
  h(
    View,
    { style: s.section, wrap: false },
    h(Text, { style: s.label }, title),
    h(View, { style: s.body }, ...children),
  );
const Entry = (e, withPdfOnly = true) =>
  h(
    View,
    { key: e.title },
    h(
      View,
      { style: s.row },
      h(Text, { style: s.title }, e.title),
      h(Text, { style: s.when }, e.when),
    ),
    ...[...e.lines, ...(withPdfOnly ? (e.pdfOnly ?? []) : [])].map((l) =>
      h(Text, { key: l, style: s.line }, l),
    ),
  );

const doc = h(
  Document,
  { title: `${resume.name} · Resume`, author: resume.name },
  h(
    Page,
    { size: "A4", style: s.page },
    h(Text, { style: s.name }, resume.name),
    h(Text, { style: s.position }, resume.position),
    h(
      View,
      { style: s.contact },
      ...resume.contact.map((c) => h(Link, { key: c.href, src: c.href, style: s.link }, c.label)),
    ),
    Section("Education", ...resume.education.map((e) => Entry(e))),
    Section("Experience", ...resume.experience.map((e) => Entry(e))),
    Section(
      "Projects",
      ...projects.map((p) =>
        h(
          View,
          { key: p.slug },
          h(
            View,
            { style: s.row },
            h(
              Text,
              null,
              h(Text, { style: s.title }, p.title),
              h(Text, { style: s.ctx }, `   ${p.context}`),
            ),
            h(Text, { style: s.when }, p.dates),
          ),
          h(Text, { style: s.line }, p.summary),
          h(
            Text,
            { style: s.nums },
            p.headline
              .slice(0, 3)
              // The PDF fonts are Latin subsets without superscripts.
              .map((x) => `${x.value.replace("s⁻¹", "/s")} ${x.label}`)
              .join("   ·   "),
          ),
        ),
      ),
    ),
    Section("Competitions", ...resume.competitions.map((e) => Entry(e))),
    Section("Coursework", ...resume.coursework.map((c) => h(Text, { key: c, style: s.line }, c))),
    Section(
      "Skills",
      ...resume.skills.map((g) =>
        h(
          Text,
          { key: g.group },
          h(Text, { style: s.title }, `${g.group}  `),
          h(Text, { style: s.line }, g.items.join(" · ")),
        ),
      ),
    ),
  ),
);

const out = path.join(root, "public/saumya-hindocha-resume.pdf");
await renderToFile(doc, out);
console.log(`resume PDF → ${path.relative(root, out)}`);
