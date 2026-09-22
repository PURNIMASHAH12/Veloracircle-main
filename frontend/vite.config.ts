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
      "/uploads": {
        target: "http://localhost:5003",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io/calls": {
        target: "http://localhost:5006",
        changeOrigin: true,
        secure: false,
        ws: true,
      },

      "/socket.io/messages": {
        target: "http://localhost:5003",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
}));
