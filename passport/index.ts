// 로그인 요청 이후 , 로그인된 user 처리 로직

import * as passport from "passport";

import Post from "../models/post";
import User from "../models/user";
import local from "./local";

export default () => {
  passport.serializeUser((user: User, done) => {
    // 로그인시 호출 됨
    // Strategy 성공 시 호출됨
    return done(null, user.id); // 여기의 user.id 가 deserializeUser의 첫 번째 매개변수로 이동
  });

  passport.deserializeUser(async (id: number, done) => {
    // deserializeUser는 매 요청마다 실행
    // 매개변수 user.id는 serializeUser의 done의 인자 user.id를 받은 것
    try {
      const user = await User.findOne({
        where: { id },
        include: [
          {
            model: Post,
            as: "Posts",
            attributes: ["id"]
          },
          {
            model: User,
            as: "Followings",
            attributes: ["id"]
          },
          {
            model: User,
            as: "Followers",
            attributes: ["id"]
          }
        ]
      });
      return done(null, user); // 여기의 user가 req.user가 됨
    } catch (e) {
      console.error(e);
      return done(e);
    }
  });

  local();
};

// 프론트에서 서버로는 cookie만 보냄
// 서버가 쿠키파서, 익스프레스 세션으로 쿠키 검사 후 id: 3 발견
// id: 3이 deserializeUser에 들어감
// req.user로 사용자 정보가 들어감

// 요청 보낼때마다 deserializeUser가 실행됨(db 요청 1번씩 실행)
// 실무에서는 deserializeUser 결과물 캐싱
