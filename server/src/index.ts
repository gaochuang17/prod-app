import express, { type NextFunction, type Request, type Response } from "express";
import { healthRouter } from "./routes/health.js";
import { recordsRouter } from "./routes/records.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";

app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/records", recordsRouter);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error(error);

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({ message: "服务器内部错误" });
});

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
