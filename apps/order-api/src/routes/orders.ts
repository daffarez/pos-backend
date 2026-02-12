import express from "express";
import { Router } from "express";
import { createOrder } from "../services/order.create";

const router = Router();

router.post("/orders", createOrder);

export default router;
