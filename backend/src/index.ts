import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import chatRoute from "./routes/chat";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// API
app.use("/api/chat", chatRoute);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ✅ ONLY ONE distPath
const distPath = path.resolve(__dirname, "../../frontend/dist");

console.log("Serving frontend from:", distPath);

// Serve frontend
app.use(express.static(distPath));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});