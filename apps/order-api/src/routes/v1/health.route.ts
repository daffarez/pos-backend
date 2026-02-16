import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "order-api",
    time: new Date().toISOString(),
  });
});

export default healthRouter;
