import { ApiError } from "../utils/index.js";

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  } else {
    console.error("Internal Server Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
      error: err.errors || [],
      data: null,
    });
  }
};
