import httpStatus from "http-status";
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

// Remove this after confirming it works and use process.env.JWT_SECRET
const TEMP_JWT_SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
    const { username, password } = req.body;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Username received:", username);
    console.log("Password received:", password ? "***" : "EMPTY");

    if (!username || !password) {
        console.log("Missing username or password");
        return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "Username and password required" });
    }

    try {
        console.log("Searching for user:", username.toLowerCase());
        const user = await User.findOne({ username: username.toLowerCase() })
            .select('+password'); 
        console.log("User found in DB:", user ? "YES" : "NO");
        if (user) {
            console.log("User details:", {
                id: user._id,
                name: user.name,
                username: user.username,
                hasPassword: !!user.password
            });
        }

        if (!user) {
            console.log("user not found");
            return res
            .status(httpStatus.UNAUTHORIZED)
            .json({ message: "Invalid credentials" });
        } 

        // Add check to ensure password exists
        if (!user.password) {
            console.error("Password field is missing from user document");
            return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: "Server configuration error" });
        }

        console.log("Comparing passwords...");
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match:", isMatch ? "YES" : "NO");

        if (!isMatch) {
            console.log("Password mismatch");
            return res
            .status(httpStatus.UNAUTHORIZED)
            .json({ message: "Invalid credentials" });
        }   

        console.log("Generating JWT token...");
        console.log("Using JWT Secret:", TEMP_JWT_SECRET);
        
        const token = jwt.sign(
            { userId: user._id },
            TEMP_JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log("Token generated successfully");
        console.log("Token (first 20 chars):", token.substring(0, 20) + "...");

        return res.status(httpStatus.OK).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
            },
        });

    } catch (error) {
        console.error("LOGIN ERROR:");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ 
            message: "Something went wrong",
            error: error.message
        });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    console.log("=== REGISTRATION ATTEMPT ===");
    console.log("Name:", name);
    console.log("Username:", username);
    console.log("Password:", password ? "***" : "EMPTY");

    if (!name || !username || !password) {
        console.log("Missing required fields");
        return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "All fields required" });
    }

    // Password length validation
    if (password.length < 6) {
        console.log("Password too short");
        return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "Password must be at least 6 characters" });
    }

    try {
        console.log("Checking if user exists:", username.toLowerCase());
        const existingUser = await User.findOne({
            username: username.toLowerCase(),
        });

        console.log("Existing user found:", existingUser ? "YES" : "NO");

        if (existingUser) {
            console.log(" User already exists");
            return res
            .status(httpStatus.CONFLICT)
            .json({ message: "User already exists" });
        }

        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed successfully");

        console.log("Creating new user...");
        const newUser = new User({
            name,
            username: username.toLowerCase(),
            password: hashedPassword,
        });

        await newUser.save();
        console.log("User saved to database:", newUser._id);

        return res
        .status(httpStatus.CREATED)
        .json({ message: "User registered successfully" });

    } catch (error) {
        console.error("REGISTRATION ERROR:");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ 
            message: "Something went wrong",
            error: error.message 
        });
    }
};

export { login, register };