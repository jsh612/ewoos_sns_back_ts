// sequelize.ts 에서 연결 설정 해주고 index.ts에서는 그것을 export 한다
// index.ts에서 바로 연결 설정을 하는 것이아님
// 순환 참조 오류 방지하기 위해서 중간에 대리인을 하나 두는 개념

import Comment, { associate as associateComment } from "./comment";
import Hashtag, { associate as associateHashtag } from "./hashtag";
import Image, { associate as associateImage } from "./image";
import Post, { associate as associatePost } from "./post";
import User, { associate as associateUser } from "./user";

export * from "./sequelize"; // import와 동시에 export

const db = {
  // model들을 담아둘 곳
  Comment,
  Hashtag,
  Image,
  Post,
  User
};

export type dbType = typeof db;

associateComment(db);
associateHashtag(db);
associateImage(db);
associatePost(db);
associateUser(db);
