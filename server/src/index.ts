import express from "express";
import { healthRouter } from "./routes/health.js";
import { recordsRouter } from "./routes/records.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";

app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/records", recordsRouter);

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
