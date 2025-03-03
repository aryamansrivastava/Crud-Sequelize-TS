import { sequelize } from "../config/database";
import { Sequelize } from "sequelize";
import User from "./userModel";
import Device from "./deviceModel";
import SessionModel from "./sessionModel";

const db: {
  models?: {
    User: typeof User;
    Device: typeof Device;
    Session: typeof SessionModel;
  };
  sequelize: Sequelize;
} = { sequelize };

db.models = {
  User: User,
  Device: Device,
  Session: SessionModel,
};

try {
  Object.keys(db.models).forEach((modelName) => {
    if (db.models) {
      db.models[modelName].associate(db.models);
    }
  });
} catch (err) {
  console.error(err);
}

export default db;