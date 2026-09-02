import { signUpUser, signInUser } from '../services/user.service.js';

export const signup = async (req, res, next) => {
  try {
    const result = await signUpUser(req.body);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await signInUser(req.body);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};