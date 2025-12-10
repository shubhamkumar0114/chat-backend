import { generateToken } from "../middleware/userToken.js";
import { USER } from "./userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";
import { error } from "console";
import { url } from "inspector";

// Create a new user
export const createUser = async (req, res) => {
  try {
    const { name, username, email, phone, password } = req.body;

    if (!name || !username || !email || !phone || !password) {
      return res.status(404).json({ error: "All fields required" });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(404).json({ error: "No image uploads" });
    }

    const { image } = req.files;

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
      phone,
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

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Find existing user
    const existingUser = await USER.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // check user is present
    const user = await USER.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(404).json({ error: "Email & Password not match" });
    }

    if (user) {
      const token = await generateToken(user._id, res);
      res.cookie("token", token);
      return res.status(200).json({
        msg: "Login Successfully",
        user,
        token,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Login error Something went wrong" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const loginUser = req.user.userId;

    const users = await USER.find({ _id: { $ne: loginUser } });
    if (!users) {
      return res.status(400).json({ error: "No users" });
    }
    return res.status(200).json({ user: users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
};

export const updateUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username } = req.body;

    const image = req.files?.image;

    let imageData ;
    if (image) {
      const upload = await cloudinary.uploader.upload(image.tempFilePath, {
        folder: "user_profiles",
        resource_type: "image",
      });
      imageData = {
        public_id: upload.public_id,
        url: upload.secure_url,
      };
    }

    const userUpdate = await USER.findByIdAndUpdate(
      { _id: id },
      { $set: { name, username, image: imageData } },
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
    const resetUrl = `http://localhost:5173/resetpassword/${resetToken}`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: user.email,
      subject: "Password Reset",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.log(error);
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

export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(404).json({ error: "filed required" });
    }

    const existUser = await USER.findOne({ phone });
    if (!existUser) {
      return res.status(404).json({ error: "Not found user" });
    }

    // Geneate otp
    const otp = Math.floor(1000 + Math.random() * 9000);
    const expireOtp = Date.now() + 5 * 60 * 1000;

    // find user
    const user = await USER.findOne({ phone });

    await USER.findOneAndUpdate(
      { phone: user?.phone },
      { $set: { otp, expireOtp } },
      { new: true }
    );
    return res.status(200).json({ msg: "saved otp", otp });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await USER.findOne({ otp });

    if (!user) {
      return res.status(404).json({ error: "Not verify" });
    }

    if (user.otp === otp) {
      const token = await generateToken(user._id, res);
      res.cookie("token", token);
      return res.status(200).json({
        msg: "Otp verify success",
        user,
        token,
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
