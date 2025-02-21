"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.deleteUser = exports.getUserById = exports.getUsers = exports.logout = exports.login = exports.signup = void 0;
const userModel_1 = require("../models/userModel");
const validator_1 = __importDefault(require("validator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (!validator_1.default.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        if (!validator_1.default.isLength(password, { min: 6, max: 30 })) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long and less than 30 characters long"
            });
        }
        const existingUser = await userModel_1.userModel.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
        const newUser = await userModel_1.userModel.create({ firstName, lastName, email, password });
        let token;
        try {
            token = newUser.getJWT();
        }
        catch (error) {
            await newUser.destroy();
            return res.status(500).json({ message: "JWT_SECRET is missing or invalid" });
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
        return res.status(201).json({ message: "User created successfully", user: userDetails });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
            error: error.toString()
        });
    }
};
exports.signup = signup;
const login = (req, res) => {
    return Promise.resolve().then(async () => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await userModel_1.userModel.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Invalid email credentials" });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password credentials" });
        }
        const token = user.getJWT();
        req.session.user = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            token
        };
        res.cookie("token", token, { httpOnly: true, expires: new Date(Date.now() + 8 * 3600000) });
        const userDetails = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            updatedAt: user.updatedAt,
            createdAt: user.createdAt
        };
        res.status(200).json({ message: "Login successful", user: req.session.user, token });
    }).catch((error) => {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message });
    });
};
exports.login = login;
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("token");
        res.status(200).json({ message: "Logged out successfully" });
    });
};
exports.logout = logout;
const getUsers = (req, res) => {
    return Promise.resolve().then(async () => {
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
    }).catch((error) => {
        console.error("Get Users error:", error);
        res.status(500).json({ message: error.message });
    });
};
exports.getUsers = getUsers;
const getUserById = (req, res) => {
    return Promise.resolve().then(async () => {
        const user = await userModel_1.userModel.findByPk(req.params.id, {
            attributes: ["id", "firstName", "lastName", "email", "createdAt", "updatedAt"]
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ data: user });
    }).catch((error) => {
        console.error("Get User by ID error:", error);
        res.status(500).json({ message: error.message });
    });
};
exports.getUserById = getUserById;
const deleteUser = (req, res) => {
    return Promise.resolve().then(async () => {
        const user = await userModel_1.userModel.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await user.destroy();
        res.status(200).json({ message: "User deleted successfully!" });
    }).catch((error) => {
        console.error("Delete User error:", error);
        res.status(500).json({ message: error.message });
    });
};
exports.deleteUser = deleteUser;
const updateUser = (req, res) => {
    return Promise.resolve().then(async () => {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ message: "First name, last name, and email are required" });
        }
        if (!validator_1.default.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        const user = await userModel_1.userModel.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        if (password) {
            if (!validator_1.default.isLength(password, { min: 6 })) {
                return res.status(400).json({ message: "Password must be at least 6 characters long" });
            }
            user.password = password;
        }
        await user.save();
        res.status(200).json({ message: "User updated successfully", user });
    }).catch((error) => {
        console.error("Update User error:", error);
        res.status(500).json({ message: error.message });
    });
};
exports.updateUser = updateUser;
// export {
//   signup, 
//   login, 
//   logout, 
//   getUsers, 
//   getUserById, 
//   deleteUser, 
//   updateUser
// };
