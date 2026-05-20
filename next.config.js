/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The doctor registration page moved under /doctor/* so patients never
  // see clinician-facing URLs on the public site. Keep the old URL alive
  // for any bookmarks or stale links.
  async redirects() {
    return [
      {
        source: "/doctor-onboard",
        destination: "/doctor/doctor-onboard",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
