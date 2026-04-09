import jwt from "jsonwebtoken";

import User from "../models/User.js";

export async function protect(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token =
      authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.headers["x-auth-token"];

    if (!token) {
      const error = new Error("Authentication token missing.");
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      const error = new Error("User no longer exists.");
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error("You are not authorized to perform this action.");
      error.statusCode = 403;
      next(error);
      return;
    }

    next();
  };
}
