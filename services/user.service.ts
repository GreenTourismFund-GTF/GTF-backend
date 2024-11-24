import { Response } from "express";
import User from "../models/userModel";

export const getUserById = async (id: string, res: Response) => {
  const user = await User.findById(id);

  res.status(200).json({
    success: true,
    user,
  });
};

export const getAllUsersService = async (res: Response) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
};

export const updateUserRoleService = async (
  res: Response,
  id: string,
  role: string
) => {
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });

  res.status(200).json({
    success: true,
    user,
  });
};
