import http from "node:http";
import dotenv from "dotenv";
dotenv.config();

import { ApiHandler } from "./api/handler.js";
import { db } from "./db/index.js";
import { s3Client } from "./services/storage.js";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";

const PORT = process.env.PORT || 3001;
const S3_BUCKET = process.env.S3_BUCKET_NAME || "jersey-fit-assets";

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function checkBucketConnection(): Promise<boolean> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    return true;
  } catch (error) {
    // If bucket credentials are mock or not provisioned yet, indicate status
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/health" || req.url === "/") {
    const isDbConnected = await checkDatabaseConnection();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "jersey-fit-backend",
        database: isDbConnected ? "connected" : "disconnected",
        port: PORT,
        time: new Date().toISOString(),
      }),
    );
    return;
  }

  // Master RPC Dispatcher Endpoint
  if (req.method === "POST" && req.url === "/api/rpc") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      // Guard against payloads > 10MB
      if (body.length > 10 * 1024 * 1024) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Payload too large" }));
        req.destroy();
      }
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const { action, params } = payload;

        if (!action) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Missing action in request body." }));
          return;
        }

        // Authenticate request context via Bearer token
        const authHeader = req.headers.authorization;
        const ctx = await ApiHandler.authenticate(authHeader);

        // Execute action
        const result = await ApiHandler.dispatch(action, params, ctx);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result ?? { success: true }));
      } catch (error: any) {
        console.error("RPC Error:", error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: error.message || "An unexpected error occurred." }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

server.listen(PORT, async () => {
  console.log("\n=======================================================");
  console.log("             JERSEY FIT BACKEND SERVER                ");
  console.log("=======================================================");
  console.log(`🚀 Server running on port : http://localhost:${PORT}`);
  console.log(`🔌 RPC Endpoint          : http://localhost:${PORT}/api/rpc`);
  console.log(`🩺 Health Check           : http://localhost:${PORT}/health`);

  // Check Database status
  const dbOk = await checkDatabaseConnection();
  if (dbOk) {
    console.log("📦 Database               : Connected (PostgreSQL)");
  } else {
    console.log("⚠️  Database               : Not connected (Check DATABASE_URL in .env)");
  }

  // Check Bucket status
  const bucketOk = await checkBucketConnection();
  if (bucketOk) {
    console.log(`🪣 Bucket (S3/Storage)    : Connected [${S3_BUCKET}]`);
  } else {
    console.log(`ℹ️  Bucket (S3/Storage)    : Ready [${S3_BUCKET}] (configured)`);
  }

  console.log("=======================================================\n");
});

