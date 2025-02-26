import express, { Request, Response } from "express";
import { z } from "zod";
import db from '../models/index';

const sessionRouter = express.Router();

const startSessionSchema = z.object({
  userId: z.number().int().positive(),
  start_time: z.string().datetime(),
});

sessionRouter.post("/start", async (req: Request, res: Response) => {
  try {
    const { userId, start_time } = startSessionSchema.parse(req.body);
    const session = await db.models.Session.create({
      userId,
      start_time: new Date(start_time),
    });
    res.status(201).json({
      status: "ok",
      message: "Session Created",
      data: session,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        status: "error", 
        message: "Invalid input data", 
        data: error.errors 
    });
    } else {
      console.error("Error Creating Session:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to start session", 
        data: error.message || "Internal Server Error" 
    });
    }
  }
  return;
});

sessionRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const session = await db.models.Session.findByPk(req.params.id);
    res.status(200).json({
        status: "success", 
        message: "Session retrieved successfully", 
        data: session 
    });
  } catch (err: any) {
    res.status(500).json({ 
        status: "error", 
        message: "Failed to retrieve session", 
        data: err.message 
    });
  }
  return;
});

export default sessionRouter;