import data from "../../content/resume.json";

// One source for the HTML resume and the PDF (scripts/resume-pdf.mjs). `pdfOnly` lines never render on the web.
export type ResumeEntry = { title: string; when: string; lines: string[]; pdfOnly?: string[] };
export type Resume = {
  name: string;
  position: string;
  contact: { label: string; href: string }[];
  education: ResumeEntry[];
  experience: ResumeEntry[];
  competitions: ResumeEntry[];
  coursework: string[];
  skills: { group: string; items: string[] }[];
};

export const resume = data as Resume;
export const RESUME_PDF = "/saumya-hindocha-resume.pdf";
