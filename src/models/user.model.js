import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: [true, "Username already exists"],
      minLength: [3, "Username must be at least 3 characters"],
      required: [true, "Please add a username"],
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      unique: [true, "Email already exists"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
      required: [true, "Please add an email"],
    },
    fullName: {
      type: String,
      required: [true, "Please add a full Name"],
    },
    avatar: {
      type: String,
      required: [true, "Please add an avatar"],
    },
    coverImage: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1545486332-9e0999c535b2?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    password: {
      type: String,
      minLength: [6, "Password must be at least 6 characters"],
      required: [true, "Please add a password"],
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "videos",
      },
    ],
    refreshToken: String,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatched = async function (
  enteredPassword
) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export default mongoose.model("User", userSchema);
