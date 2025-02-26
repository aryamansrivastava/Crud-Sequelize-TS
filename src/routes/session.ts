import express from "express";
import { startSession, getSessionById } from "../controller/sessionController";

const sessionRouter = express.Router();

sessionRouter.post("/start", startSession);

sessionRouter.get("/:id", getSessionById);

export default sessionRouter;