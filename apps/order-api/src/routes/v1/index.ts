import { Router } from "express";
import ordersRouter from "./orders.route";
import healthRouter from "./health.route";

const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use(ordersRouter);

export default v1Router;
