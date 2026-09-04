import app from "./app";
import config from "./config";

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
