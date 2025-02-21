"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnection = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
exports.sequelize = new sequelize_1.Sequelize('MyDatabase', 'sa', 'Aryaman@1234', {
    host: 'localhost',
    dialect: 'mssql',
    logging: false,
});
const dbConnection = async () => {
    try {
        await exports.sequelize.authenticate();
        console.log('Database connected successfully!');
    }
    catch (err) {
        console.error('Unable to connect to the database:', err);
    }
};
exports.dbConnection = dbConnection;
