import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import User from "./userModel";

interface SessionAttributes {
  id: number;
  userId: number;
  start_time: Date;
}

interface SessionCreationAttributes extends Optional<SessionAttributes, "id"> {}

class SessionModel
  extends Model<SessionAttributes, SessionCreationAttributes>
  implements SessionAttributes
{
  public id!: number;
  public userId!: number;
  public start_time!: Date;

  static associate(models: any) {
    models.User.hasMany(models.Session, { foreignKey: "userId", as: "sessions" });
    models.Session.belongsTo(models.User, { foreignKey: "userId" });
  }
}

SessionModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "SessionModel",
    tableName: "Sessions",
    timestamps: false,
  }
);

export default SessionModel;