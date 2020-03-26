import User from "../models/user";

// req 타입 수정 방법
declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
