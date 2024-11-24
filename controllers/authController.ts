import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import crypto from "crypto";
import AppError from "../errorsHandlers/appError";
import catchAsync from "../utils/catchAsync";
import Email from "../emails/email";
import
{
  IActivationRequest,
  IForgotPassword,
  ILoginRequest,
  IRegistrationBody,
  IUpdatePassword,
  IUpdateUserInfo,
} from "../DTOs/UserDtos";
import { IActivationToken } from "../DTOs/UserDtos";
import
{
  SignInAccessToken,
  SignInRefreshToken,
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/sendToken";
import User from "../models/userModel";
import IUser from "../models/userInterface.js";
import { ObjectId } from "mongoose";

// Create activation token and the token
export const createActivationToken = (user: any): IActivationToken =>
{
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const activationToken = jwt.sign(
    { user, activationCode },
    process.env.JWT_SECRET as Secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN as string,
    }
  );

  return { activationToken, activationCode };
};

// Verify Account before saving it.
export const verifyAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    const { name, email, password, passwordConfirm } = req.body;

    const checkEmail = await User.findOne({ email });
    if (checkEmail) return next(new AppError("Email Already exists", 400));

    const user: IRegistrationBody = {
      name,
      email,
      password,
      passwordConfirm,
    };

    const { activationToken, activationCode } = createActivationToken(user);

    const data = {
      user: { name: user.name },
      activationCode,
    };

    await new Email(user, data).activateRegistration();

    res.status(201).json({
      success: true,
      message: `Please check your email: ${user.email} to activate your account!`,
      activationToken,
    });
  }
);

// Sign Up the user - persist user data to database
export const signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    const { activation_token, activation_code } =
      req.body as IActivationRequest;

    const newUser: { user: IUser; activationCode: string } = jwt.verify(
      activation_token,
      process.env.JWT_SECRET as string
    ) as { user: IUser; activationCode: string };

    if (newUser.activationCode != activation_code)
      return next(new AppError("Invalid token. Please try again", 401));

    const { name, email, password, passwordConfirm } = newUser.user;

    const user = await User.create({
      name,
      email,
      password,
      passwordConfirm,
    });

    sendToken(user, 201, res);
  }
);

//Log user in and send token
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    const { email, password } = req.body as ILoginRequest;

    // 1) Check if email and password exist
    if (!email || !password)
    {
      return next(new AppError("Please provide email and password!", 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password)))
    {
      return next(new AppError("Incorrect email or password", 401));
    }

    // 3) If everything ok, send token to client
    sendToken(user, 200, res);
  }
);

//logout User
export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    try
    {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      const userId = req.user?._id || "";

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (err: any)
    {
      return next(new AppError(err.message, 400));
    }
  }
);

// update access token
export const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    const refresh_token = req.cookies.refresh_token as string;

    const decoded = jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN as string
    ) as JwtPayload;

    const message = "Could not refresh token";
    if (!decoded) return next(new AppError(message, 400));

    const currentUser = await User.findById(decoded.id);

    if (!currentUser)
      return next(new AppError("Please login to access these resources!", 400));

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

    const accessToken = SignInAccessToken(currentUser._id as ObjectId, "5m");
    const refreshToken = SignInRefreshToken(currentUser._id as ObjectId, "3d");

    req.user = currentUser;

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);


    return next();
  }
);

// Update user info
export const updateUserInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    const { name } = req.body as IUpdateUserInfo;

    const userId = req.user?._id;

    if (!userId)
    {
      return next(new AppError('User not authenticated', 401));
    }

    const user = await User.findById(userId);

    if (!user)
    {
      return next(new AppError('User not found', 404));
    }

    if (name && user) user.name = name;

    await user?.save({ validateBeforeSave: false });


    res.status(200).json({
      status: "success",
      user,
    });
  }
);

// update password
export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    const { oldPassword, newPassword, confirmPassword } =
      req.body as IUpdatePassword;

    if (!oldPassword || !newPassword)
      return next(
        new AppError("Please provide your old and new passwords", 400)
      );

    if (!confirmPassword)
      return next(new AppError("Please confirm your password", 400));

    // 1) Get user from collection
    const user = await User.findById(req.user._id).select("+password");

    if (!user || user.password === "undefined")
    {
      return next(new AppError("Invalid user", 400));
    }
    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(oldPassword, user.password)))
    {
      return next(new AppError("Your current password is wrong.", 401));
    }

    // 3) If so, update password
    user.password = newPassword;
    user.passwordConfirm = confirmPassword;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    // 1) Get user based on POSTed email
    const { email } = req.body as IForgotPassword;

    const user = await User.findOne({ email });

    if (!user)
    {
      return next(new AppError("There is no user with email address.", 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try
    {
      const data = {
        user: { name: user.name },
        resetToken,
        resetURL: `${req.protocol}://${req.get(
          "host"
        )}/api/v1/users/reset-password/${resetToken}`,
      };

      await new Email(user, data).sendPasswordReset();

      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });
    } catch (err)
    {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
  {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user)
    {
      return next(new AppError("Token is invalid or has expired", 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    res.status(200).json({
      status: "success",
      message:
        "Password reset successful. Please, log in with your new password.",
    });
  }
);
