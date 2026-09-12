import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Two products share this repo: the NumberCaller marketing site at `/` and
   * the SNK Courier console at `/ops`.
   *
   * The SNK deployment is its own Vercel project, where the console *is* the
   * product and the marketing site is not part of the deliverable — so its
   * root goes straight to the console. Opt-in via `SNK_STANDALONE=1`, set on
   * that project only, so the NumberCaller deployment is untouched.
   *
   * A redirect rather than a rewrite: Vercel resolves rewrites after the
   * filesystem, and `/` exists here, so a rewrite would never fire.
   */
  async redirects() {
    if (process.env.SNK_STANDALONE !== "1") return [];
    return [{ source: "/", destination: "/ops", permanent: false }];
  },
};

export default nextConfig;
