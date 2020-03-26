import * as express from "express";
import * as bcrypt from "bcrypt";

import User from "../models/user";
import { isLoggedIn } from "./middleware";

const router = express.Router();

router.get("/", isLoggedIn, (req, res, next) => {
  const user = req.user!.toJSON() as User;
  delete user.password;
  return res.json(user);
});

router.post("/", async (req, res, next) => {
  try {
    const exUser = await User.findOne({
      where: {
        userId: req.body.userId
      }
    });
    if (exUser) {
      return res.status(403).send("이미 가입된 아이디입니다.");
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const newUser = await User.create({
      nickname: req.body.nickname,
      userId: req.body.userId,
      password: hashedPassword
    });
    return res.status(200).json(newUser);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});
