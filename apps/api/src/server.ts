import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./modules/auth/auth.routes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import issueRoutes from "./modules/issues/issue.routes.js";
import commentRoutes from "./modules/comments/comment.routes.js";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});
//socket.io connection handling
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("organization:join", async (organizationId: string) => {
        console.log("Organization join request received:", organizationId);
        try {
            const token = socket.handshake.auth?.token;
            console.log("Socket token present:", Boolean(token));

            if (!token || typeof organizationId !== "string") {
                return;
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET!
            ) as { userId: string };

            const membership = await prisma.membership.findFirst({
                where: {
                    userId: decoded.userId,
                    organizationId,
                },
            });
            console.log("Membership lookup result:", membership);

            if (!membership) {
                socket.emit("organization:error", {
                    message: "You are not a member of this organization",
                });
                return;
            }

            socket.join(organizationId);
            console.log("Socket joined organization:", organizationId);
        } catch (error) {
            console.error("Organization room join failed:", error);
            socket.emit("organization:error", {
                message: "Unable to join organization",
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});



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
httpServer.listen(PORT, () => {
    console.log(`Nexus API running at http://localhost:${PORT}`);
    console.log(`Socket.IO server ready on port ${PORT}`);
});
