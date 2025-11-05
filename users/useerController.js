import { generateToken } from "../middleware/userToken.js";
import { USER } from "./userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";

export const createUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const { image } = req.files;
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No image uploads" });
    }

    const result = await cloudinary.uploader.upload(image.tempFilePath, {
      folder: "user_profiles",
      resource_type: "image",
    });

    // Find existing user
    const existingUser = await USER.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "All ready user exist" });
    }

    // hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Save New User
    const newUser = await USER.create({
      name,
      username,
      email,
      password: hashPassword,
      image: {
        url: result?.secure_url,
        public_id: result?.public_id,
      },
    });

    if (newUser) {
      return res.status(201).json({ msg: "User Created Successfully " });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Find existing user
    const existingUser = await USER.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ error: "All ready user exist" });
    }

    // check user is present
    const user = await USER.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Email & Password not match" });
    }

    if (user) {
      const token = await generateToken(user._id, res);
      return res.status(200).json({ msg: "Login Successfully", user, token });
    }
  } catch (error) {
    return res.status(500).json({ error: "Login error Something went wrong" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const loginUser = req.user.userId;

    // store phone number
    // await UserGroupConversation.find()
    const users = await USER.find({ _id: { $ne: loginUser } });
    return res.status(200).json({ user: users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  console.log("logout");
};

export const updateUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email } = req.body;
    const userUpdate = await USER.findByIdAndUpdate(
      { _id: id },
      { $set: { name, username, email } },
      { new: true }
    );
    if (userUpdate)
      return res.status(200).json({ msg: "User update success ", userUpdate });
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const ForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await USER.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    // Reset link
    const resetUrl = `http://localhost:5174/resetpassword/${resetToken}`;

    // Send email (use real SMTP credentials in production)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "shubhamjha6299@gmail.com",
        pass: "fudk qyrs nuaj kyry",
      },
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<Link to={"/"}>Click here to reset password: <a href="${resetUrl}">${resetUrl}</a></Link>`,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    return res.status(500).json({ error: error?.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await USER.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Token invalid or expired" });

    const hashResetPass = await bcrypt.hash(password, 10);
    user.password = hashResetPass;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
