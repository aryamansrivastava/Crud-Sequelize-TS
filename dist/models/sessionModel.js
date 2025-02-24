"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const userModel_1 = require("./userModel");
class Session extends sequelize_1.Model {
}
Session.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: userModel_1.userModel,
            key: 'id',
        },
    },
    start_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'Session',
});
userModel_1.userModel.hasMany(Session, {
    foreignKey: 'email',
    onDelete: 'CASCADE',
});
Session.belongsTo(userModel_1.userModel, {
    foreignKey: 'email',
});
exports.default = Session;
//# sourceMappingURL=sessionModel.js.map