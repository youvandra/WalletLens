import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { profileWallet, isValidAddress } from "./service.js";
import { buildSlideshowHtml } from "./renderer.js";
import { buildMcpServer } from "./mcp.js";
import type { TxWrapRequest, TxWrapResponse } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SLIDES_DIR = path.join(__dirname, "..", "slides");
const FRONTEND_DIR = path.join(__dirname, "..", "..", "frontend");

const app = express();

app.use(express.json());

// Serve generated slides
app.use("/slides", express.static(SLIDES_DIR));

// Serve frontend static files
app.use(express.static(FRONTEND_DIR));

// Handle /wrap/:address route — serve frontend, JS picks up the address
app.get("/wrap/:address", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "txwrap" });
});

// MCP server (stateless HTTP) — the agent-facing surface. Each request gets a
// fresh server + transport so there is no cross-request session state.
app.post("/mcp", async (req, res) => {
  const server = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP error:", err);
    if (!res.headersSent) res.status(500).json({ error: "MCP request failed" });
  }
});

// Stateless mode: no session-based GET stream / DELETE.
app.all("/mcp", (_req, res) => {
  res.status(405).json({ error: "Method not allowed" });
});

// Human-facing endpoint: full profile plus the roast and a saved slideshow.
app.post("/api/txwrap", async (req, res) => {
  try {
    const { address } = req.body as TxWrapRequest;

    if (!isValidAddress(address || "")) {
      const response: TxWrapResponse = {
        success: false,
        error: "Invalid address format. Must be a 0x-prefixed 42-char address.",
      };
      res.status(400).json(response);
      return;
    }

    const { metrics, personality, markdown } = await profileWallet(address, { roast: true });

    // Generate and save slideshow HTML
    const html = buildSlideshowHtml(address, metrics, personality!);
    if (!fs.existsSync(SLIDES_DIR)) {
      fs.mkdirSync(SLIDES_DIR, { recursive: true });
    }
    const slideFile = `${address.toLowerCase()}.html`;
    fs.writeFileSync(path.join(SLIDES_DIR, slideFile), html, "utf-8");

    const baseUrl = `${req.protocol}://${req.get("host") || `localhost:${config.port}`}`;
    const slideshowUrl = `${baseUrl}/wrap/${address}`;

    const response: TxWrapResponse = {
      success: true,
      data: {
        metrics,
        personality: personality!,
        slideshowUrl,
        markdown: markdown!,
      },
    };

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("TxWrap error:", err);
    const response: TxWrapResponse = {
      success: false,
      error: message,
    };
    res.status(500).json(response);
  }
});

app.listen(config.port, () => {
  console.log(`TxWrap server running on port ${config.port}`);
});
