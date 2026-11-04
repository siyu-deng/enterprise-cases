import type { NextConfig } from "next";

const config: NextConfig = {
  // The project maintains its own committed AI handoff rules.
  agentRules: false,
  poweredByHeader: false,
  output: "standalone",
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
  },
};

export default config;
