import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const signUpUser = async (userData) => {
  const { username, email, password, role } = userData;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Username';

    const error = new Error(`${field} is already registered`);
    error.statusCode = 409;

    throw error;
  }

  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters long');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    role
  });

  const userResponse = newUser.toObject();
  delete userResponse.password;
  delete userResponse.__v;

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    user: userResponse,
    token
  };
};

export const signInUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.__v;

  return { user: userResponse, token };
};