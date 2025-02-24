import express, { Request, Response } from "express";
import SessionModel from "../models/sessionModel";

const sessionRouter = express.Router();

sessionRouter.post("/start", async (req: Request, res: Response) => {
    try {
        const { userId, start_time } = req.body;
        const session = await SessionModel.create({
            userId,
            start_time,
        });
        res.status(201).json(session);
    } catch (error: any) {
        console.error("Error Creating Session:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
    return;
});

sessionRouter.get("/:id", async (req: Request, res: Response) => {
    try {
        const session = await SessionModel.findByPk(req.params.id);
        res.status(200).json(session);
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
    return;
});

export default sessionRouter;