import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import User from "./userModel";

interface DeviceAttributes {
  id: number;
  name: string;
  userId: number;
}

interface DeviceCreationAttributes extends Optional<DeviceAttributes, "id"> {}

class Device
  extends Model<DeviceAttributes, DeviceCreationAttributes>
  implements DeviceAttributes
{
  public id!: number;
  public name!: string;
  public userId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    models.User.hasMany(models.Device, { foreignKey: "userId", 
      // as: "devices"
     });
    models.Device.belongsTo(models.User, { foreignKey: "userId" });
  }
}

Device.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Device",
  }
);

// Device.belongsTo(User, {
//   foreignKey: 'userId',
//   as: 'user',
// });

export default Device;