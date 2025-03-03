import express, { type Router } from "express";
import * as userController from "../controller/userController";
import { apiLimiter } from "../middlewares/rateLimit";
import { isAuthenticated } from "../middlewares/auth";

const router: Router = express.Router();

router.post("/signup", userController.signup);

router.post("/login", [apiLimiter, userController.login]);

router.post("/logout", [userController.logout]);

router.post("/create", userController.createUser);

router.get("/getuser/:id", [isAuthenticated, apiLimiter, userController.getUserById]);

router.get("/getallusers", [isAuthenticated, apiLimiter, userController.getUsers]);

router.delete("/delete/:id", userController.deleteUser);

router.put("/update/:id", userController.updateUser);

export { router };