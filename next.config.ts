import type { NextConfig } from "next";

/*
 * En-têtes de sécurité. La CSP se limite volontairement aux directives sans
 * risque de casse : interdiction d'être affiché dans une iframe (clickjacking
 * de /admin), de changer l'URL de base, d'embarquer des plugins et d'envoyer
 * un formulaire vers un autre site. Pas de script-src : Next et Vercel
 * Analytics injectent des scripts en ligne qu'il faudrait autoriser par nonce.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [{ source: "/:key([a-f0-9]{16,64}).txt", destination: "/api/indexnow?key=:key" }];
  },
};

export default nextConfig;
