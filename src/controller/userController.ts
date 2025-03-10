import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import db from "../models/index";
import { getUserDevice } from "../utils/getUserDevice";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const signupSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

const logoutSchema = z.object({
  query: z.object({}).strict(),
});

const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});

const getUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    size: z.string().regex(/^\d+$/).optional(),
  }),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .optional(),
});

export const verifyToken = async(req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token required" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET as string);
    res.status(200).json({ message: "Token is valid" });
    return;
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
}

export const signup = async (req: Request, res: Response) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.errors });
      return;
    }

    const { firstName, lastName, email, password } = result.data;

    const existingUser = await db.models.User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const newUser = await db.models.User.create({
      firstName,
      lastName,
      email,
      password,
    });

    let token: string;
    try {
      token = newUser.getJWT();
    } catch (error) {
      await newUser.destroy();
      res.status(500).json({ message: "Token can't be generated" });
      return;
    }

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 8 * 3600000),
    });

    const userDetails = {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      updatedAt: newUser.updatedAt,
      createdAt: newUser.createdAt,
    };

    res
      .status(201)
      .json({ message: "User created successfully", user: userDetails });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
      error: error.toString(),
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

    const user = await db.models.User.findOne({ where: { email } });
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

    const session = await db.models.Session.create({
      userId: user.id,
      start_time: new Date(),
    });

    req.session["user"] = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token,
      sessionStartTime: session.start_time,
    } as {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      token: string;
      sessionStartTime: Date;
    };

    const device = await db.models.Device.create({
      userId: user.id,
      name: getUserDevice(req),
    });

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 8 * 3600000),
    });

    res
      .status(200)
      .json({ message: "Login successful", user: req.session["user"], token });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
      error: error.toString(),
    });
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    logoutSchema.parse({ query: req.query });

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Logout failed" });
        return;
      }
      res.clearCookie("token");
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        error: error.errors,
      });
    } else {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const validated = createUserSchema.parse({
      body: req.body,
    });
    const { firstName, lastName, email, password } = validated.body as {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    };

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const newUser = await db.models.User.create({
      firstName,
      lastName,
      email,
      password,
    });
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid data",
        errors: error.errors,
      });
    } else {
      console.error("Error creating user:", error);
      res
        .status(500)
        .json({ message: error.message || "Internal Server Error" });
    }
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const validated = getUsersSchema.parse({
      query: req.query,
    });
    let { page=1, size=10, search="", filter="{}" } = req.query as {
      page?: string;
      size?: string;
      search?: string;
      filter?: string;
    };
    const currentPage = Math.max(parseInt(page as string) || 1);
    const limit = Math.max(parseInt(size as string), 1);
    const offset = (currentPage - 1) * limit;

    const includeConditions: any[] = [];
    const whereCondition: any = {};

    if (search) {
      whereCondition[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

  try {
      const parsedFilter = JSON.parse(filter);

      if (parsedFilter.firstName) {
        whereCondition.firstName = { [Op.like]: `%${parsedFilter.firstName}%` };
      }
      if (parsedFilter.lastName) {
        whereCondition.lastName = { [Op.like]: `%${parsedFilter.lastName}%` };
      }
      if (parsedFilter.email) {
        whereCondition.email = { [Op.like]: `%${parsedFilter.email}%` };
      }
      if (parsedFilter.createdAt) {
        whereCondition.createdAt = { [Op.gte]: new Date(parsedFilter.createdAt) };
      }
      if (parsedFilter.lastLogin) {
        includeConditions.push({
          model: db.models.Session,
          as: "Sessions",
          attributes: ["start_time"],
          required: true,
          where: {
            start_time: { [Op.gte]: new Date(parsedFilter.lastLogin) },
          },
        });
      } 
      else {
        includeConditions.push({
          model: db.models.Session,
          as: "Sessions",
          attributes: ["start_time"],
          required: false,
          limit: 1,
          order: [["start_time", "DESC"]],
        });
      }
      if (parsedFilter.deviceName) {
        includeConditions.push({
          model: db.models.Device,
          attributes: ["name"],
          where: { name: { [Op.like]: `%${parsedFilter.deviceName}%` } },
          required: true, 
        });
      } else {
        includeConditions.push({
          model: db.models.Device,
          attributes: ["name"],
          required: false,
        });
      }
    } catch (error) {
      return res.status(400).json({ message: "Invalid filter format" });
    }

    const users = await db.models.User.findAll({
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "createdAt",
        "updatedAt",
      ],
      include: includeConditions,
      where: whereCondition,
      limit,
      offset, 
      order: [["createdAt", "DESC"]],
    });

    const totalUsers = await db.models.User.count({ where: whereCondition });
    const totalPages = Math.ceil(totalUsers / limit);
    const start = offset + 1;
    const end = Math.min(offset + limit, totalUsers);

    res.status(200).json({
      data: users,
      totalUsers,
      totalPages,
      currentPage : currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      start,
      end,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.errors,
      });
    } else {
      console.error("Get Users error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
        error: error.toString(),
      });
    }
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await db.models.User.findByPk(req.params.id, {
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "createdAt",
        "updatedAt",
      ],
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
      error: error.toString(),
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await db.models.User.findByPk(req.params.id);
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
      error: error.toString(),
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const validatedData = updateUserSchema.parse(req.body);

    const { firstName, lastName, email, password } = req.body;

    const user = await db.models.User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.firstName = validatedData.firstName;
    user.lastName = validatedData.lastName;
    user.email = validatedData.email;

    if (validatedData.password) {
      user.password = validatedData.password;
    }

    await user.save();
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid Input",
        error: error.errors,
      });
    }
    console.error("Update User error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
      error: error.toString(),
    });
  }
};
