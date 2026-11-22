import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import {
  authenticate,
  AuthRequest,
} from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

// Organization validation
const organizationSchema = z.object({
  name: z.string().min(2, "Organization name must contain at least 2 characters"),
});

// POST /api/organizations
router.post("/", authenticate, async (req, res) => {
  try {
    const validation = organizationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization details",
        errors: validation.error.issues,
      });
    }

    const userId = (req as AuthRequest).userId!;

    const { name } = validation.data;

    const slug =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now().toString(36);

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,

        memberships: {
          create: {
            userId,
            role: "ADMIN",
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization,
    });
  } catch (error) {
    console.error("Organization creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create organization",
    });
  }
});

// GET /api/organizations
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;

    const memberships = await prisma.membership.findMany({
      where: {
        userId,
      },
      include: {
        organization: true,
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const organizations = memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
      joinedAt: membership.joinedAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Organizations retrieved successfully",
      organizations,
    });
  } catch (error) {
    console.error("Fetch organizations error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve organizations",
    });
  }
});

// POST /api/organizations/:organizationId/members
router.post(
  "/:organizationId/members",
  authenticate,
  requireRole(["ADMIN"]),
  async (req, res) => {
    try {
      const organizationId = Array.isArray(req.params.organizationId)
        ? req.params.organizationId[0]
        : req.params.organizationId;

      const validation = z.object({
        email: z.string().email("Enter a valid email address"),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address",
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          email: validation.data.email,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No registered user found with this email",
        });
      }

      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId,
          },
        },
      });

      if (existingMembership) {
        return res.status(409).json({
          success: false,
          message: "User is already a member of this organization",
        });
      }

      const membership = await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId,
          role: "MEMBER",
        },
      });

      return res.status(201).json({
        success: true,
        message: "Member added successfully",
        membership,
      });
    } catch (error) {
      console.error("Add organization member error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to add organization member",
      });
    }
  }
);

// GET /api/organizations/:organizationId/admin-test
router.get(
  "/:organizationId/admin-test",
  authenticate,
  requireRole(["ADMIN"]),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "ADMIN access granted!",
    });
  }
);

export default router;