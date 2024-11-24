import express from "express";
import {
  forgotPassword,
  login,
  logout,
  refreshToken,
  resetPassword,
  signUp,
  updatePassword,
  updateUserInfo,
  verifyAccount,
} from "../controllers/authController";
import { isAuthenticated } from "../middlewares/protectRoute";
import {
  deleteUser,
  getAllUsers,
  getUserInfo,
  socialAuth,
  updateProfilePicture,
  updateUserRole,
} from "../controllers/userController";
import { restrictTo } from "../middlewares/roleManager";

const router = express.Router();

router.route("/verify-account").post(verifyAccount);
router.route("/signup").post(signUp);
router.route("/login").post(login);
router.route("/social-auth").post(socialAuth);
router.route("/refreshToken").get(refreshToken);
router.route("/forgot-password").post(forgotPassword);
router.patch("/reset-password/:token", resetPassword);

// router.use(refreshToken);
router.use(isAuthenticated);

router.route("/logout").get(logout);
router.route("/me").get(getUserInfo);
router.route("/update-user-info").patch(updateUserInfo);
router.route("/update-password").patch(updatePassword);
router.route("/upload-profile-picture").patch(updateProfilePicture);

router.use(restrictTo("admin"));
router.route("/update-user-role").patch(updateUserRole);
router.route("/get-users").get(getAllUsers);
router.route("/delete-user/:id").delete(deleteUser);

export default router;
