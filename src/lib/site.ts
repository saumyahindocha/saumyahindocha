// The public address. Set NEXT_PUBLIC_SITE_URL on Vercel once the domain is known.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://saumyahindocha.vercel.app"
).replace(/\/$/, "");
