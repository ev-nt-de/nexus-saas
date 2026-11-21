import type { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthRequest } from "./auth.middleware.js";

type OrganizationRole = "ADMIN" | "MANAGER" | "MEMBER";

export const requireRole = (allowedRoles: OrganizationRole[]) => {
    return async (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            //   const userId = req.userId;
            //   const organizationId = req.params.organizationId;
            const userId = req.userId;

            const organizationId = Array.isArray(req.params.organizationId)
                ? req.params.organizationId[0]
                : req.params.organizationId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
            }

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    message: "Organization ID is required",
                });
            }

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

            if (!allowedRoles.includes(membership.role)) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to perform this action",
                });
            }

            next();
        } catch (error) {
            console.error("Role authorization error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to verify organization permissions",
            });
        }
    };
};