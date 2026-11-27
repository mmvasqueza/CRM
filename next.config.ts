import type { NextConfig } from "next";

// Cache Components (the create-next-app default) is left off: every CRM page reads the
// signed-in user's session cookie, so pages are dynamic by design. See sdd/decisions.md.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
