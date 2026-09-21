import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

import tsConfigPaths from "vite-tsconfig-paths";

import { nitro } from "nitro/vite";

import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ command }) => ({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),

    tailwindcss(),

    tanstackStart({
      server: {
        entry: "server",
      },
    }),

    viteReact(),

    basicSsl(),

    command === "build"
      ? nitro()
      : undefined,
  ].filter(Boolean),

  server: {
  host: "0.0.0.0",
  port: 5173,

  proxy: {
    "/api": {
       target: "http://localhost:4000",
      changeOrigin: true,
      secure: false,
    },

    "/socket.io": {
      target: "http://192.168.1.78:5000",
      changeOrigin: true,
      secure: false,
      ws: true,
    },
  },
},
}));
