import cors from "cors";
import express from "express";
import { requestContext } from "./middleware/request-context";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { healthRouter } from "./routes/health";
import { jobsRouter } from "./routes/jobs";
import { tasksRouter } from "./routes/tasks";
import { agentsRouter } from "./routes/agents";
import { auditRouter } from "./routes/audit";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestContext);

  app.use(healthRouter);
  app.use(jobsRouter);
  app.use(tasksRouter);
  app.use(agentsRouter);
  app.use(auditRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
