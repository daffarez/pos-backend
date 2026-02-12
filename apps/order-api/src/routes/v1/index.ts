import { Router } from "express";
import ordersRouter from "./orders";

const v1Router = Router();

v1Router.use(ordersRouter);

export default v1Router;
