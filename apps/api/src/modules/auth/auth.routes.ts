import {
    authenticate,
    AuthRequest,
} from "../../middleware/auth.middleware.js";
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";


const router = Router();

// Registration input validation
const registerSchema = z.object({
    name: z.string().min(2, "Name must contain at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration details",
                errors: validation.error.issues,
            });
        }

        const { name, email, password } = validation.data;

        // Check whether the email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
        }

        // Hash the password before storing it
        const passwordHash = await bcrypt.hash(password, 12);

        // Create the user in PostgreSQL
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong during registration",
        });
    }
});

import jwt from "jsonwebtoken";

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const loginSchema = z.object({
            email: z.string().email("Enter a valid email address"),
            password: z.string().min(1, "Password is required"),
        });

        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid login details",
                errors: validation.error.issues,
            });
        }

        const { email, password } = validation.data;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.passwordHash) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Compare entered password with stored hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check JWT secret
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured");
        }

        // Generate access token
        const accessToken = jwt.sign(
            { userId: user.id },
            jwtSecret,
            { expiresIn: "15m" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong during login",
        });
    }
});

// GET /api/auth/me - Get logged-in user
router.get("/me", authenticate, async (req, res) => {
    try {
        const userId = (req as AuthRequest).userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Authenticated user retrieved successfully",
            user,
        });
    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve user profile",
        });
    }
});

export default router;