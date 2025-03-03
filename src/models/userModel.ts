import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Device from "./deviceModel";

interface UserAttributes {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

  public getJWT(): string {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign(
      { id: this.id, email: this.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );
  }

  static associate(models: any) {
    models.User.hasMany(models.Session, { foreignKey: "userId", 
      as: "Sessions"
     });
    // models.User.hasMany(models.Device, { foreignKey: "userId", 
    //  as: "devices"
    //  });
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "First name is required" } },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Last name is required" } },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: { msg: "Invalid email format" } },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [6, 30],
          msg: "Password must be between 6 and 30 characters",
        },
      },
    },
  },
  {
    sequelize,
    modelName: "User",
  }
);

// User.beforeCreate(async (user) => {
//   user.password = await bcrypt.hash(user.password, 10);
// });

// User.hasMany(SessionModel,
//   {foreignKey: "userId", as: "sessions"}
// )

// User.hasMany(Device, {
//   foreignKey: "userId",
//   // as: "devices"
// });

export default User;