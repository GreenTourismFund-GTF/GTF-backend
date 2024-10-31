export interface IRegistrationBody
{
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  avatar?: string;
}

export interface IActivationToken
{
  activationToken: string;
  activationCode: string;
}

export interface IActivationRequest
{
  activation_code: string;
  activation_token: string;
}

export interface ILoginRequest
{
  email: string;
  password: string;
}

export interface ISocialAuthBody
{
  email: string;
  name: string;
  avatar: string;
}

//update user info
export interface IUpdateUserInfo
{
  name?: string;
  email?: string;
}

//update password
export interface IUpdatePassword
{
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

//update profile picture
export interface IUpdateProfilePicture
{
  avatar: string;
}

export interface IForgotPassword
{
  email?: string;
}
