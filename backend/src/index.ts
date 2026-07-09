import express from "express";
import { config } from "./config.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "txwrap" });
});

app.listen(config.port, () => {
  console.log(`TxWrap server running on port ${config.port}`);
});
