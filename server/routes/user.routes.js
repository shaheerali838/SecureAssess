import express from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

export default userRoutes;
