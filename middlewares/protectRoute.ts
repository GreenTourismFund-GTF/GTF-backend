import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../errorsHandlers/appError";
import Jwt, { JwtPayload } from "jsonwebtoken";
import { refreshToken } from "../controllers/authController";
import User from "../models/userModel";

export const isAuthenticated = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    const access_token = req.cookies.access_token;

    if (!access_token)
      return next(new AppError("Please, login to access this resources", 401));

    const decoded = Jwt.decode(
      access_token
      //   process.env.ACCESS_TOKEN as string
    ) as JwtPayload;

    if (!decoded) return next(new AppError("Invalid Access Token", 400));

    // Check if the access token is expired
    if (decoded.exp && decoded.exp <= Date.now() / 100)
    {
      try
      {
        await refreshToken(req, res, next);
      } catch (error)
      {
        return next(error);
      }
    } else
    {
      const currentUser = await User.findById(decoded.id);

      if (!currentUser)
        return next(new AppError("Please login to access this resource", 400));

      // 4) Check if user changed password after the token was issued
      if (currentUser?.changedPasswordAfter(decoded.iat ?? 0))
      {
        return next(
          new AppError(
            "User recently changed password! Please log in again.",
            401
          )
        );
      }

      req.user = currentUser;
      next();
    }
  }
);
