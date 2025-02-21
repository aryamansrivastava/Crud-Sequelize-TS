import { Sequelize } from "sequelize";

export const sequelize = new Sequelize('MyDatabase', 'sa', 'Aryaman@1234', {
    host: 'localhost',
    dialect: 'mssql',
    logging: false,
});

export const dbConnection = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully!');
    } catch (err) {
        console.error('Unable to connect to the database:', err);
    }
};
