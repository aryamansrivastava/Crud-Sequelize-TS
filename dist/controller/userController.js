"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.deleteUser = exports.getUserById = exports.getUsers = exports.createUser = exports.logout = exports.login = exports.signup = void 0;
const userModel_1 = require("../models/userModel");
const validator_1 = __importDefault(require("validator"));
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Invalid email format" }),
    password: zod_1.z.string().min(1, { message: "Password is required" })
});
const signupSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, { message: "First name is required" }),
    lastName: zod_1.z.string().min(1, { message: "Last name is required" }),
    email: zod_1.z.string().email({ message: "Invalid email format" }),
    password: zod_1.z.string().min(6, { message: "Password must be at least 6 characters long" })
});
const signup = async (req, res) => {
    try {
        const result = signupSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ errors: result.error.errors });
            return;
        }
        const { firstName, lastName, email, password } = result.data;
        const existingUser = await userModel_1.userModel.findOne({ where: { email } });
        if (existingUser) {
            res.status(409).json({ message: "User already exists" });
            return;
        }
        const newUser = await userModel_1.userModel.create({ firstName, lastName, email, password });
        let token;
        try {
            token = newUser.getJWT();
        }
        catch (error) {
            await newUser.destroy();
            res.status(500).json({ message: "Token can't be generated" });
            return;
        }
        res.cookie("token", token, { httpOnly: true, expires: new Date(Date.now() + 8 * 3600000) });
        const userDetails = {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            updatedAt: newUser.updatedAt,
            createdAt: newUser.createdAt
        };
        res.status(201).json({ message: "User created successfully", user: userDetails });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
            error: error.toString()
        });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ errors: result.error.errors });
            return;
        }
        const { email, password } = result.data;
        const user = await userModel_1.userModel.findOne({ where: { email } });
        if (!user) {
            res.status(400).json({ message: "Invalid email credentials" });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(400).json({ message: "Invalid password credentials" });
            return;
        }
        const token = user.getJWT();
        req.session['user'] = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            token
        };
        res.cookie("token", token, { httpOnly: true, expires: new Date(Date.now() + 8 * 3600000) });
        res.status(200).json({ message: "Login successful", user: req.session['user'], token });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
            error: error.toString()
        });
    }
};
exports.login = login;
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            res.status(500).json({ message: "Logout failed" });
            return;
        }
        res.clearCookie("token");
        res.status(200).json({ message: "Logged out successfully" });
    });
};
exports.logout = logout;
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }
        if (!validator_1.default.isEmail(email)) {
            res.status(400).json({ message: "Invalid email format" });
            return;
        }
        if (!validator_1.default.isLength(password, { min: 6 })) {
            res.status(400).json({ message: "Password must be at least 6 characters long" });
            return;
        }
        const newUser = await userModel_1.userModel.create({ firstName, lastName, email, password });
        res.status(201).json({ message: "User created successfully", user: newUser });
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};
exports.createUser = createUser;
const getUsers = async (req, res) => {
    try {
        let { page, size } = req.query;
        const currentPage = parseInt(page) || 1;
        const limit = parseInt(size) || 6;
        const offset = (currentPage - 1) * limit;
        const { count, rows: users } = await userModel_1.userModel.findAndCountAll({
            attributes: ["id", "firstName", "lastName", "email", "createdAt", "updatedAt"],
            offset,
            limit,
            order: [["createdAt", "DESC"]]
        });
        res.status(200).json({
            data: users,
            totalUsers: count,
            totalPages: Math.ceil(count / limit),
            currentPage
        });
    }
    catch (error) {
        console.error("Get Users error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
            error: error.toString()
        });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const user = await userModel_1.userModel.findByPk(req.params.id, {
            attributes: ["id", "firstName", "lastName", "email", "createdAt", "updatedAt"]
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ data: user });
    }
    catch (error) {
        console.error("Get User by ID error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
            error: error.toString()
        });
    }
};
exports.getUserById = getUserById;
const deleteUser = async (req, res) => {
    try {
        const user = await userModel_1.userModel.findByPk(req.params.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        await user.destroy();
        res.status(200).json({ message: "User deleted successfully!" });
    }
    catch (error) {
        console.error("Delete User error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
            error: error.toString()
        });
    }
};
exports.deleteUser = deleteUser;
const updateUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email) {
            res.status(400).json({ message: "First name, last name, and email are required" });
            return;
        }
        if (!validator_1.default.isEmail(email)) {
            res.status(400).json({ message: "Invalid email format" });
            return;
        }
        const user = await userModel_1.userModel.findByPk(req.params.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        if (password) {
            if (!validator_1.default.isLength(password, { min: 6 })) {
                res.status(400).json({ message: "Password must be at least 6 characters long" });
                return;
            }
            user.password = password;
        }
        await user.save();
        res.status(200).json({ message: "User updated successfully", user });
    }
    catch (error) {
        console.error("Update User error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
            error: error.toString()
        });
    }
};
exports.updateUser = updateUser;
//# sourceMappingURL=userController.js.map