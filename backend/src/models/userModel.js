import { Schema } from "mongoose";
import mongoose from "mongoose";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        username: { 
            type: String, 
            unique: true,
            required: [true, "Username is required"], 
            lowercase: true, 
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"], 
            minlength: [6, "Password must be at least 6 characters"],
            select: false 
        }
    },
    { timestamps: true }
);


userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model("User", userSchema);

export { User };