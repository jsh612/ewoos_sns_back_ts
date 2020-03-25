import { Sequelize } from "sequelize";
import config from "../config/config";

const env =
  (process.env.NODE_ENV as "production" | "test" | "development") ||
  "development";
const { database, username, password } = config[env];
const sequelize = new Sequelize(database, username, password, config[env]); // sequelize와 db 연결

export { sequelize };
export default sequelize;
