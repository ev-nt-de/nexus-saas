import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import {
    authenticate,
    AuthRequest,
} from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

// Project validation
const projectSchema = z.object({
    name: z.string().min(2, "Project name must contain at least 2 characters"),
    description: z.string().optional(),
});

// POST /api/organizations/:organizationId/projects
router.post(
    "/:organizationId/projects",
    authenticate,
    requireRole(["ADMIN", "MANAGER"]),
    async (req, res) => {
        try {
            const validation = projectSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid project details",
                    errors: validation.error.issues,
                });
            }

            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const { name, description } = validation.data;

            const project = await prisma.project.create({
                data: {
                    name,
                    description,
                    organizationId,
                },
            });

            return res.status(201).json({
                success: true,
                message: "Project created successfully",
                project,
            });
        } catch (error) {
            console.error("Project creation error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to create project",
            });
        }
    }
);

// GET /api/organizations/:organizationId/projects
router.get(
    "/:organizationId/projects",
    authenticate,
    async (req, res) => {
        try {
            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const userId = (req as AuthRequest).userId!;

            // Check organization membership
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId,
                        organizationId,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: "You do not belong to this organization",
                });
            }

            // Retrieve organization projects
            const projects = await prisma.project.findMany({
                where: {
                    organizationId,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return res.status(200).json({
                success: true,
                message: "Projects retrieved successfully",
                projects,
            });
        } catch (error) {
            console.error("Fetch projects error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve projects",
            });
        }
    }
);

// PUT /api/organizations/:organizationId/projects/:projectId
router.put(
    "/:organizationId/projects/:projectId",
    authenticate,
    requireRole(["ADMIN", "MANAGER"]),
    async (req, res) => {
        try {
            const updateProjectSchema = z.object({
                name: z.string().min(2).optional(),
                description: z.string().optional(),
            });

            const validation = updateProjectSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid project details",
                    errors: validation.error.issues,
                });
            }

            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const projectId = Array.isArray(req.params.projectId)
                ? req.params.projectId[0]
                : req.params.projectId;

            // Find project within the user's organization
            const existingProject = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    organizationId,
                },
            });

            if (!existingProject) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found in this organization",
                });
            }

            const updatedProject = await prisma.project.update({
                where: {
                    id: projectId,
                },
                data: validation.data,
            });

            return res.status(200).json({
                success: true,
                message: "Project updated successfully",
                project: updatedProject,
            });
        } catch (error) {
            console.error("Project update error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update project",
            });
        }
    }
);

// DELETE /api/organizations/:organizationId/projects/:projectId
router.delete(
    "/:organizationId/projects/:projectId",
    authenticate,
    requireRole(["ADMIN", "MANAGER"]),
    async (req, res) => {
        try {
            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const projectId = Array.isArray(req.params.projectId)
                ? req.params.projectId[0]
                : req.params.projectId;

            // Verify that the project belongs to this organization
            const existingProject = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    organizationId,
                },
            });

            if (!existingProject) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found in this organization",
                });
            }

            await prisma.project.delete({
                where: {
                    id: projectId,
                },
            });

            return res.status(200).json({
                success: true,
                message: "Project deleted successfully",
            });
        } catch (error) {
            console.error("Project deletion error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to delete project",
            });
        }
    }
);

export default router;