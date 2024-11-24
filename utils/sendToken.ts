import { Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { ObjectId } from "mongoose";
import IUser from "../models/userInterface";

interface ITokenOptions
{
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// Parse environment variables to integrate with fallback values
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES_IN || "300",
  10
);

const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES_IN || "1200",
  10
);

// options for cookies
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

// Prepare and send token to the user
export const sendToken = (user: IUser, statusCode: number, res: Response) =>
{

  const accessToken = SignInAccessToken(user._id as ObjectId, "3m");
  const refreshToken = SignInRefreshToken(user._id as ObjectId, "3d");


  // Only set secure to true in production
  if (process.env.NODE_ENV === "production") accessTokenOptions.secure = true;

  // Add both tokens to the cookie response
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  // Remove password from output
  res.status(statusCode).json({
    success: true,
    // user: userWithoutPassword,
    user,
    accessToken,
  });
};

// Sign Access token
export const SignInAccessToken = function (id: ObjectId, exp: string): string
{
  return jwt.sign({ id }, process.env.ACCESS_TOKEN as Secret, {
    expiresIn: exp,
  });
};

// Sign Refresh token
export const SignInRefreshToken = function (id: ObjectId, exp: string): string
{
  return jwt.sign({ id }, process.env.REFRESH_TOKEN as Secret, {
    expiresIn: exp,
  });
};
