import express, { type Router } from "express";
import * as userController from "../controller/userController";
import { apiLimiter } from "../middlewares/rateLimit";
import { isAuthenticated } from "../middlewares/auth";

const router: Router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", [apiLimiter, userController.login]);
router.post("/logout", [isAuthenticated, userController.logout]);

router.post("/create", [isAuthenticated, userController.createUser]);

router.get("/getuser/:id", [isAuthenticated, apiLimiter, userController.getUserById]);
router.get("/getallusers", [isAuthenticated, apiLimiter, userController.getUsers]);

router.delete("/delete/:id", [isAuthenticated, userController.deleteUser]);
router.put("/update/:id", [isAuthenticated, userController.updateUser]);

router.get("/verify-token", isAuthenticated, userController.verifyToken);

export { router };