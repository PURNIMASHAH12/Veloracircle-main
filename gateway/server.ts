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

const USER_SERVICE_URL =
    process.env.USER_SERVICE_URL ||
    "http://localhost:5002";

    const MESSAGE_SERVICE_URL =
  process.env.MESSAGE_SERVICE_URL ||
  "http://localhost:5003";

  const CONVERSATION_SERVICE_URL =
  process.env.MESSAGE_SERVICE_URL ||
  "http://127.0.0.1:5003";

  const CIRCLE_SERVICE_URL =
  process.env.CIRCLE_SERVICE_URL ||
  "http://127.0.0.1:5004";


  const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL ||
  "http://127.0.0.1:5005";

  const CALL_SERVICE_URL =
  process.env.CALL_SERVICE_URL ||
  "http://127.0.0.1:5006";
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
app.use(
  "/api/calls",
  createProxyMiddleware({
    target: CALL_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/calls/",
    },
  }),
);
app.use(
  "/api/conversations",
  createProxyMiddleware({
    target: CONVERSATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/conversations/",
    },
  }),
);
app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/notifications/",
    },
  }),
);
app.use(
  "/api/circles",
  createProxyMiddleware({
    target: CIRCLE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/circles/",
    },
  }),
);
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
app.use(
    "/api/otp",
    createProxyMiddleware({
        target: AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            "^/": "/api/auth/otp/",
        },
    }),
);
app.use(
    "/api/users",
    createProxyMiddleware({
        target: USER_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            "^/": "/api/users/",
        },
    }),
);

app.use(
  "/api/messages",
  createProxyMiddleware({
    target: MESSAGE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/messages/",
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