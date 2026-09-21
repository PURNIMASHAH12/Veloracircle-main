import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "http://localhost:5000";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ||
  "http://localhost:5001";

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.get("/", (_req, res) => {
  res.json({
    message: "Velora Circle API Gateway is running",
  });
});

// Auth Service
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/auth/",
    },
  }),
);

// Existing backend
app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
  }),
);

app.listen(PORT, () => {
  console.log(
    `API Gateway running on port ${PORT}`,
  );

  console.log(
    `Forwarding API requests to ${BACKEND_URL}`,
  );

  console.log(
    `Auth requests forwarded to ${AUTH_SERVICE_URL}`,
  );
});