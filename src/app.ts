import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import { apiLimiter } from "./middlewares/rateLimiter";
import config from "./config";

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin }));

app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/payments/webhook") {
    return next();
  }
  express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running", data: null });
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;