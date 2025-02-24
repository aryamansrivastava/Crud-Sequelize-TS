"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class User extends sequelize_1.Model {
    async validatePassword(password) {
        return await bcrypt_1.default.compare(password, this.password);
    }
    getJWT() {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        return jsonwebtoken_1.default.sign({ id: this.id, email: this.email }, process.env.JWT_SECRET, {
            expiresIn: "8h",
        });
    }
}
exports.userModel = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "First name is required" } },
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Last name is required" } },
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: { msg: "Invalid email format" } },
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: {
                args: [6, 30],
                msg: "Password must be between 6 and 30 characters",
            },
        },
    },
}, {
    sequelize: database_1.sequelize,
    modelName: "User",
});
User.beforeCreate(async (user) => {
    user.password = await bcrypt_1.default.hash(user.password, 10);
});
//# sourceMappingURL=userModel.js.map