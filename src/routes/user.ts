import express, { type Router } from "express";
import * as userController from "../controller/userController";
import { apiLimiter } from "../middlewares/rateLimit";

const router: Router = express.Router();

router.post("/signup", userController.signup);

router.post("/login", [apiLimiter,userController.login]);

router.post("/logout", userController.logout);

router.post("/create", userController.createUser);

router.get("/getuser/:id", [apiLimiter,userController.getUserById]);

router.get("/getallusers", [apiLimiter, userController.getUsers]);

router.delete("/delete/:id", userController.deleteUser);

router.put("/update/:id", userController.updateUser);

export { router };