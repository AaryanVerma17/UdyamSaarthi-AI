const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { InvalidInputError, AppError } = require("../middlewares/errorHandler");

async function register(req, res, next) {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password || password.length < 8) {
      throw new InvalidInputError("name, phone, and password (min 8 chars) are required");
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      const err = new AppError("A user with this phone number already exists", 409);
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, phone, passwordHash });

    const token = jwt.sign(
      { id: user._id, name: user.name, phone: user.phone },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, user: { id: user._id, name: user.name, phone: user.phone } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) throw new InvalidInputError("phone and password are required");

    const user = await User.findOne({ phone });
    if (!user) throw new AppError("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401);

    const token = jwt.sign(
      { id: user._id, name: user.name, phone: user.phone },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, user: { id: user._id, name: user.name, phone: user.phone } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
