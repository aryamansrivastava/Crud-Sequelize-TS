"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sessionModel_1 = __importDefault(require("@/models/sessionModel"));
const router = express_1.default.Router();
router.post("/start-session", async (req, res) => {
    try {
        const { email, start_time } = req.body;
        const session = await sessionModel_1.default.create({
            email,
            start_time,
        });
        res.status(201).json(session);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=session.js.map