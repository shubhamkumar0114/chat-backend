import express from "express";
import {
  createUser,
  ForgetPassword,
  getAllUsers,
  loginUser,
  resetPassword,
  updateUsers,
} from "./useerController.js";
import { userAuth } from "../middleware/userToken.js";
const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/allusers", userAuth, getAllUsers);
router.put("/updateuser/:id", updateUsers);
router.post("/forgotpassword", ForgetPassword);
router.post("/resetpassword/:token", resetPassword);
export default router;
