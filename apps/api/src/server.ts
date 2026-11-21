import authRoutes from "./modules/auth/auth.routes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import issueRoutes from "./modules/issues/issue.routes.js";
import commentRoutes from "./modules/comments/comment.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/organizations", projectRoutes);
app.use("/api/organizations", issueRoutes);
app.use("/api/organizations", commentRoutes);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Nexus API is running!",
    });
});

// Database connection test
app.get("/db-test", async (req, res) => {
    try {
        await prisma.$connect();

        const organizations = await prisma.organization.findMany();

        res.status(200).json({
            success: true,
            message: "PostgreSQL connected successfully!",
            organizationCount: organizations.length,
        });
    } catch (error) {
        console.error("Database connection failed:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Nexus API running at http://localhost:${PORT}`);
});