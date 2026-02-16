import { Router } from "express";
import { createOrder } from "../../controller/orders/order.controller";

const ordersRouter = Router();

ordersRouter.post("/orders", createOrder);

export default ordersRouter;
