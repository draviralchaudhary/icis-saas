import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import chatRoute from "./routes/chat";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// AI Chat Route
app.use("/api/chat", chatRoute);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});