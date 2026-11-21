import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: string;
}

export interface AuthRequest extends Request {
    userId?: string;
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Read the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing",
            });
        }

        // Extract the token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }

        // Get JWT secret
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured");
        }

        // Verify the token
        // const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        const decoded = jwt.verify(token, jwtSecret);

        console.log("JWT verification successful:", decoded);

        // Attach user ID to the request
        //req.userId = decoded.userId;
        req.userId = (decoded as JwtPayload).userId;

        // Continue to the requested route
        next();
    // } catch (error) {
    //     return res.status(401).json({
    //         success: false,
    //         message: "Invalid or expired authentication token",
    //     });
    // }
    } catch (error) {
  console.error("JWT verification error:", error);

  return res.status(401).json({
    success: false,
    message: "Invalid or expired authentication token",
  });
}
};