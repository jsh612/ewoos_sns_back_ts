import * as express from "express";
import * as bcrypt from "bcrypt";
import { isLoggedIn } from "./middleware";
import User from "../models/user";
import * as passport from "passport";
import Post from "../models/post";
import Image from "../models/image";

const router = express.Router();

// /api/user
router.get("/", isLoggedIn, (req, res) => {
  const user = req.user!.toJSON() as User;
  delete user.password;
  return res.json(user);
});
// /api/user 회원가입
router.post("/", async (req, res, next) => {
  try {
    const exUser = await User.findOne({
      where: {
        userId: req.body.userId
      }
    });
    if (exUser) {
      return res.status(403).send("이미 사용중인 아이디입니다.");
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12); // salt는 10~13 사이
    const newUser = await User.create({
      nickname: req.body.nickname,
      userId: req.body.userId,
      password: hashedPassword
    });

    console.log("생성된 유저", newUser);
  } catch (e) {
    console.log(e);
    return next(e);
  }
});

// /api/user/login
router.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    (err: Error, user: User, info: { message: string }) => {
      if (err) {
        console.log(err);
        return next(err);
      }
      if (info) {
        return res.status(401).send(info.message);
      }
      return req.login(user, async (loginErr: Error) => {
        // req.login : passport에서 제공
        try {
          if (loginErr) {
            return next(loginErr);
          }
          const fullUser = await User.findOne({
            where: { id: user.id },
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
            ],
            attributes: ["id", "nickname", "userId"]
          });
          console.log("fullUser", fullUser);
          return res.json(fullUser);
        } catch (error) {
          return next(error);
        }
      });
    }
  )(req, res, next);
});

// /api/user/logout
router.post("/logout", isLoggedIn, (req, res) => {
  req.logout();
  if (req.session) {
    req.session.destroy(err => {
      res.send("logout 성공");
    });
  } else {
    res.send("logout 성공");
  }
});

// 특정사용자 정보 가져오기, /api/user/XXX
interface IUser extends Partial<User> {
  PostCount: number;
  FollowingCount: number;
  FollowerCount: number;
}
router.get("/:id", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: parseInt(req.params.id, 10) },
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
      ],
      attributes: ["id", "nickname"]
    });
    if (!user) {
      return res.status(404).send("해당 유저가 없습니다.");
    }
    const jsonUser = user.toJSON() as IUser;
    jsonUser.PostCount = jsonUser.Posts ? jsonUser.Posts.length : 0;
    jsonUser.FollowingCount = jsonUser.Followings
      ? jsonUser.Followings.length
      : 0;
    jsonUser.FollowerCount = jsonUser.Followers ? jsonUser.Followers.length : 0;
    return res.json(jsonUser);
  } catch (error) {
    console.log("/:id 에러", error);
    return next(error);
  }
});

// /api/user/:id/followings
router.get("/:id/followings", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        // 0 -> id가 없는 경우 아무도 안가져오기 위한 꼼수
        id: parseInt(req.params.id, 10) || (req.user && req.user.id) || 0
      }
    });
    if (!user) {
      return res.status(404).send("no user");
    }
    const followers = await user.getFollowings({
      attributes: ["id", "nickname"],
      limit: parseInt(req.query.limit, 10),
      offset: parseInt(req.query.offset, 10)
    });
    return res.json(followers);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 나의 팔로워 제거
router.delete("/:id/follower", isLoggedIn, async (req, res, next) => {
  try {
    const me = await User.findOne({
      where: { id: req.user!.id }
    });
    await me!.removeFollower(parseInt(req.params.id, 10));
    res.send(req.params.id);
  } catch (e) {
    console.error("/:id/follower 에러", e);
    next(e);
  }
});

// 팔로윙
router.post("/:id/follow", isLoggedIn, async (req, res, next) => {
  try {
    const me = await User.findOne({
      where: { id: req.user!.id }
    });
    await me!.addFollowing(parseInt(req.params.id, 10));
    res.send(req.params.id);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 팔로윙 삭제
router.delete("/:id/follow", isLoggedIn, async (req, res, next) => {
  try {
    const me = await User.findOne({
      where: { id: req.user!.id }
    });
    await me!.removeFollowing(parseInt(req.params.id, 10));
    res.send(req.params.id);
  } catch (e) {
    console.error("/:id/follow 에러", e);
    next(e);
  }
});

// 특정 유저의 post 가져오기
router.get("/:id/posts", async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      where: {
        UserId: parseInt(req.params.id, 10) || (req.user && req.user.id) || 0,
        RetweetId: null
      },
      include: [
        {
          model: User,
          attributes: ["id", "nickname"]
        },
        {
          model: Image
        },
        {
          model: User,
          as: "Likers",
          attributes: ["id"]
        }
      ]
    });
    res.json(posts);
  } catch (e) {
    console.error("/:id/posts 에러", e);
    next(e);
  }
});

// 닉네임 수정
router.patch("/nickname", isLoggedIn, async (req, res, next) => {
  // patch는 부분 수정시 사용 (<-> put: 전체 수정)
  try {
    await User.update(
      {
        nickname: req.body.nickname
      },
      {
        where: { id: req.user!.id }
      }
    );
    res.send(req.body.nickname);
  } catch (e) {
    console.error("/nickname 에러", e);
    next(e);
  }
});

export default router;
