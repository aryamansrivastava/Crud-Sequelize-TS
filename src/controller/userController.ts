import { Request, Response } from "express";
import { userModel } from "../models/userModel";
import validator from "validator";
import {z} from "zod";
import bcrypt from "bcryptjs";
import SessionModel from "../models/sessionModel";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" })
});

const signupSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),  
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" })
});

export const signup = async (req: Request, res: Response) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.errors });
      return;
    }

    const { firstName, lastName, email, password } = result.data;

    const existingUser = await userModel.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const newUser = await userModel.create({ firstName, lastName, email, password });

    let token: string;
    try {
      token = newUser.getJWT();
    } catch (error) {
      await newUser.destroy();
      res.status(500).json({ message: "Token can't be generated"});
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
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
      error: error.toString()
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.errors });
      return;
    }

    const { email, password } = result.data;

    const user = await userModel.findOne({ where: { email } });
    if (!user) {
      res.status(400).json({ message: "Invalid email credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid password credentials" });
      return;
    }

    const token = user.getJWT();

    const session = await SessionModel.create({
      userId: user.id,
      start_time: new Date(),
    });

    req.session['user'] = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token,
      sessionStartTime: session.start_time,
    };

    res.cookie("token", token, { httpOnly: true, expires: new Date(Date.now() + 8 * 3600000) });

    res.status(200).json({ message: "Login successful", user: req.session['user'], token });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
      error: error.toString()
    });
  }
};
  
  export const logout = (req: Request, res: Response) => {
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

  export const createUser = async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password } = req.body as {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
      };
  
      if (!firstName || !lastName || !email || !password) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }
  
      if (!validator.isEmail(email)) {
        res.status(400).json({ message: "Invalid email format" });
        return;
      }
  
      if (!validator.isLength(password, { min: 6 })) {
        res.status(400).json({ message: "Password must be at least 6 characters long" });
        return;
      }
  
      const newUser = await userModel.create({ firstName, lastName, email, password });
      res.status(201).json({ message: "User created successfully", user: newUser });
  
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: error.message || "Internal Server Error" });
    }
  };
  
  export const getUsers = async (req: Request, res: Response) => {
    try {
      let { page, size } = req.query;
      const currentPage = parseInt(page as string) || 1;
      const limit = parseInt(size as string) || 6;
      const offset = (currentPage - 1) * limit;
  
      const { count, rows: users } = await userModel.findAndCountAll({
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
    } catch (error: any) {
      console.error("Get Users error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
        error: error.toString()
      });
    }
  };
  
  export const getUserById = async (req: Request, res: Response) => {
    try {
      const user = await userModel.findByPk(req.params.id, {
        attributes: ["id", "firstName", "lastName", "email", "createdAt", "updatedAt"]
      });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json({ data: user });
    } catch (error: any) {
      console.error("Get User by ID error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
        error: error.toString()
      });
    }
  };
  
  export const deleteUser = async (req: Request, res: Response) => {
    try {
      const user = await userModel.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      await user.destroy();
      res.status(200).json({ message: "User deleted successfully!" });
    } catch (error: any) {
      console.error("Delete User error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
        error: error.toString()
      });
    }
  };
  
  export const updateUser = async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password } = req.body;
  
      if (!firstName || !lastName || !email) {
        res.status(400).json({ message: "First name, last name, and email are required" });
        return;
      }  
  
      if (!validator.isEmail(email)) {
        res.status(400).json({ message: "Invalid email format" });
        return;
      }
  
      const user = await userModel.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
  
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
  
      if (password) {
        if (!validator.isLength(password, { min: 6 })) {
          res.status(400).json({ message: "Password must be at least 6 characters long" });
          return;
        }
        user.password = password;
      }
  
      await user.save();
      res.status(200).json({ message: "User updated successfully", user });
    } catch (error: any) {
      console.error("Update User error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
        error: error.toString()
      });
    }
  };