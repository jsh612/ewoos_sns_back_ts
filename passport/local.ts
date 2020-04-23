// passport 로그인 요청시 로직

import * as passport from "passport";
import * as bcrypt from "bcrypt";
import { Strategy } from "passport-local";
import User from "../models/user";

export default () => {
  passport.use(
    "local",
    new Strategy(
      {
        usernameField: "userId", // front에서 req.body에 넣은 이름
        passwordField: "password", // front에서 req.body에 넣은 이름
      },
      async (userId, password, done) => {
        try {
          const user = await User.findOne({ where: { userId } });
          if (!user) {
            return done(null, false, {
              message: "존재하지 않는 사용자입니다!",
            });
          }
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          }
          return done(null, false, { message: "비밀번호가 틀립니다." });
        } catch (e) {
          console.error(e);
          return done(e);
        }
      }
    )
  );
};
