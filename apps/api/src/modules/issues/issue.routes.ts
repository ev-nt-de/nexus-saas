import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import {
    authenticate,
    AuthRequest,
} from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

// Issue validation
const issueSchema = z.object({
    title: z.string().min(2, "Issue title must contain at least 2 characters"),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    assigneeId: z.string().uuid().optional(),
});

// POST /api/organizations/:organizationId/projects/:projectId/issues
router.post(
    "/:organizationId/projects/:projectId/issues",
    authenticate,
    requireRole(["ADMIN", "MANAGER"]),
    async (req, res) => {
        try {
            const validation = issueSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid issue details",
                    errors: validation.error.issues,
                });
            }

            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const projectId = Array.isArray(req.params.projectId)
                ? req.params.projectId[0]
                : req.params.projectId;

            // Verify that the project belongs to this organization
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    organizationId,
                },
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found in this organization",
                });
            }

            // Verify that the assignee belongs to this organization
            if (validation.data.assigneeId) {
                const assigneeMembership = await prisma.membership.findUnique({
                    where: {
                        userId_organizationId: {
                            userId: validation.data.assigneeId,
                            organizationId,
                        },
                    },
                });

                if (!assigneeMembership) {
                    return res.status(400).json({
                        success: false,
                        message: "Assignee does not belong to this organization",
                    });
                }
            }

            const issue = await prisma.issue.create({
                data: {
                    title: validation.data.title,
                    description: validation.data.description,
                    priority: validation.data.priority,
                    projectId,
                    assigneeId: validation.data.assigneeId,
                },
            });

            return res.status(201).json({
                success: true,
                message: "Issue created successfully",
                issue,
            });
        } catch (error) {
            console.error("Issue creation error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to create issue",
            });
        }
    }
);

// GET /api/organizations/:organizationId/projects/:projectId/issues
router.get(
    "/:organizationId/projects/:projectId/issues",
    authenticate,
    async (req, res) => {
        try {
            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const projectId = Array.isArray(req.params.projectId)
                ? req.params.projectId[0]
                : req.params.projectId;

            const userId = (req as AuthRequest).userId!;

            // Verify organization membership
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

            // Verify project belongs to organization
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    organizationId,
                },
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found in this organization",
                });
            }

            // Retrieve project issues
            const issues = await prisma.issue.findMany({
                where: {
                    projectId,
                },
                include: {
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return res.status(200).json({
                success: true,
                message: "Issues retrieved successfully",
                issues,
            });
        } catch (error) {
            console.error("Fetch issues error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve issues",
            });
        }
    }
);

// PUT /api/organizations/:organizationId/projects/:projectId/issues/:issueId
router.put(
    "/:organizationId/projects/:projectId/issues/:issueId",
    authenticate,
    requireRole(["ADMIN", "MANAGER"]),
    async (req, res) => {
        try {
            const updateIssueSchema = z.object({
                title: z.string().min(2).optional(),
                description: z.string().optional(),
                status: z.enum([
                    "BACKLOG",
                    "TODO",
                    "IN_PROGRESS",
                    "IN_REVIEW",
                    "DONE",
                ]).optional(),
                priority: z.enum([
                    "LOW",
                    "MEDIUM",
                    "HIGH",
                    "URGENT",
                ]).optional(),
            }).refine(
                (data) => Object.keys(data).length > 0,
                "At least one field must be provided"
            );

            const validation = updateIssueSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid issue details",
                    errors: validation.error.issues,
                });
            }

            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const projectId = Array.isArray(req.params.projectId)
                ? req.params.projectId[0]
                : req.params.projectId;

            const issueId = Array.isArray(req.params.issueId)
                ? req.params.issueId[0]
                : req.params.issueId;

            // Verify project ownership
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    organizationId,
                },
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found in this organization",
                });
            }

            // Verify issue belongs to this project
            const existingIssue = await prisma.issue.findFirst({
                where: {
                    id: issueId,
                    projectId,
                },
            });

            if (!existingIssue) {
                return res.status(404).json({
                    success: false,
                    message: "Issue not found in this project",
                });
            }

            const updatedIssue = await prisma.issue.update({
                where: {
                    id: issueId,
                },
                data: validation.data,
            });

            return res.status(200).json({
                success: true,
                message: "Issue updated successfully",
                issue: updatedIssue,
            });
        } catch (error) {
            console.error("Issue update error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update issue",
            });
        }
    }
);

// DELETE /api/organizations/:organizationId/projects/:projectId/issues/:issueId
router.delete(
    "/:organizationId/projects/:projectId/issues/:issueId",
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

            const issueId = Array.isArray(req.params.issueId)
                ? req.params.issueId[0]
                : req.params.issueId;

            // Verify that the project belongs to this organization
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    organizationId,
                },
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found in this organization",
                });
            }

            // Verify that the issue belongs to this project
            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId,
                    projectId,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    success: false,
                    message: "Issue not found in this project",
                });
            }

            await prisma.issue.delete({
                where: {
                    id: issueId,
                },
            });

            return res.status(200).json({
                success: true,
                message: "Issue deleted successfully",
            });
        } catch (error) {
            console.error("Issue deletion error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to delete issue",
            });
        }
    }
);

export default router;