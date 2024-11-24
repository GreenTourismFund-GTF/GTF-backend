import { Document } from "mongoose";

export default interface IUser extends Document
{
  name: string;
  email: string;
  password: string
  passwordConfirm: string | undefined;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  passwordChangedAt: any;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | undefined;
  active: boolean;
  correctPassword: (
    candidatePassword: string,
    userPassword: string
  ) => Promise<boolean>;
  changedPasswordAfter: (JWTTimestamp: number) => boolean;
  createPasswordResetToken: () => string;
  find: (filter: any) => Array<[]>;
}
