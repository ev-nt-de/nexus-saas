import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

// Comment validation
const commentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
});

// POST /api/organizations/:organizationId/issues/:issueId/comments
router.post(
    "/:organizationId/issues/:issueId/comments",
    authenticate,
    async (req, res) => {
        try {
            const validation = commentSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid comment",
                    errors: validation.error.issues,
                });
            }

            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const issueId = Array.isArray(req.params.issueId)
                ? req.params.issueId[0]
                : req.params.issueId;

            const userId = (req as import("../../middleware/auth.middleware.js").AuthRequest).userId!;

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

            // Verify issue belongs to this organization
            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId,
                    project: {
                        organizationId,
                    },
                },
            });

            if (!issue) {
                return res.status(404).json({
                    success: false,
                    message: "Issue not found in this organization",
                });
            }

            const comment = await prisma.comment.create({
                data: {
                    content: validation.data.content,
                    issueId,
                    userId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            return res.status(201).json({
                success: true,
                message: "Comment added successfully",
                comment,
            });
        } catch (error) {
            console.error("Comment creation error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to add comment",
            });
        }
    }
);

// GET /api/organizations/:organizationId/issues/:issueId/comments
router.get(
    "/:organizationId/issues/:issueId/comments",
    authenticate,
    async (req, res) => {
        try {
            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const issueId = Array.isArray(req.params.issueId)
                ? req.params.issueId[0]
                : req.params.issueId;

            const userId = (req as import("../../middleware/auth.middleware.js").AuthRequest).userId!;

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

            // Verify issue belongs to organization
            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId,
                    project: {
                        organizationId,
                    },
                },
            });

            if (!issue) {
                return res.status(404).json({
                    success: false,
                    message: "Issue not found in this organization",
                });
            }

            // Retrieve comments
            const comments = await prisma.comment.findMany({
                where: {
                    issueId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            });

            return res.status(200).json({
                success: true,
                message: "Comments retrieved successfully",
                comments,
            });
        } catch (error) {
            console.error("Fetch comments error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve comments",
            });
        }
    }
);

// DELETE /api/organizations/:organizationId/issues/:issueId/comments/:commentId
router.delete(
    "/:organizationId/issues/:issueId/comments/:commentId",
    authenticate,
    async (req, res) => {
        try {
            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            const issueId = Array.isArray(req.params.issueId)
                ? req.params.issueId[0]
                : req.params.issueId;

            const commentId = Array.isArray(req.params.commentId)
                ? req.params.commentId[0]
                : req.params.commentId;

            const userId = (req as import("../../middleware/auth.middleware.js").AuthRequest).userId!;

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

            // Verify issue belongs to organization
            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId,
                    project: {
                        organizationId,
                    },
                },
            });

            if (!issue) {
                return res.status(404).json({
                    success: false,
                    message: "Issue not found in this organization",
                });
            }

            // Find comment
            const comment = await prisma.comment.findFirst({
                where: {
                    id: commentId,
                    issueId,
                },
            });

            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: "Comment not found",
                });
            }

            // Only the author or an ADMIN/MANAGER can delete
            const isAuthor = comment.userId === userId;
            const canModerate = ["ADMIN", "MANAGER"].includes(membership.role);

            if (!isAuthor && !canModerate) {
                return res.status(403).json({
                    success: false,
                    message: "You can only delete your own comments",
                });
            }

            await prisma.comment.delete({
                where: {
                    id: commentId,
                },
            });

            return res.status(200).json({
                success: true,
                message: "Comment deleted successfully",
            });
        } catch (error) {
            console.error("Comment deletion error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to delete comment",
            });
        }
    }
);

export default router;