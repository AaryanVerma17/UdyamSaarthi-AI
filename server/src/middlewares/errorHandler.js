/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.name || "InternalServerError",
    message: err.message || "Something went wrong",
  });
}

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class SchemeNotApplicableError extends AppError {
  constructor(message = "Project cost is outside all stated scheme limits") {
    super(message, 422);
  }
}

class InvalidInputError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400);
  }
}

module.exports = { errorHandler, AppError, SchemeNotApplicableError, InvalidInputError };
