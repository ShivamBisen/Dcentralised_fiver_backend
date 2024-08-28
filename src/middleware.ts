import { NextFunction, Request, Response } from "express";
import { SECRET } from "./index";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"] ?? "";
    const token =  authHeader.split(" ")[1]
    try {
        const decoded = jwt.verify(authHeader, SECRET);
        console.log(decoded);
        // @ts-ignore
        if (decoded.userId) {
            // @ts-ignore
            req.userId = decoded.userId;
            return next();
        } else {
            return res.status(403).json({
                message: "You are not logged in"
            })    
        }
    } catch(e) {
        return res.status(403).json({
            message: "You are not logged in"
        })
    }
}