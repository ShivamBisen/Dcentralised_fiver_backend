import { NextFunction, Request, Response } from "express";
import { SECRET } from "./index";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"] ?? "";

    // If the authHeader contains a space (indicating "Bearer <token>"), split and get the second part.
    // Otherwise, assume the authHeader is the token itself.
    const token = authHeader.includes(" ") ? authHeader.split(" ")[1] : authHeader;

    if (!token) {
        return res.status(403).json({
            message: "No token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        console.log(decoded);
        // @ts-ignore
        if (decoded.userid) {
            // @ts-ignore
            req.userid = decoded.userid;
            return next();
        } else {
            return res.status(403).json({
                message: "You are not logged in"
            });
        }
    } catch(e) {
        return res.status(403).json({
            message: "You are not logged in"
        });
    }
}
