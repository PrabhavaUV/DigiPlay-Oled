const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error('[Database] FATAL: DATABASE_URL environment variable is required to connect to PostgreSQL.');
}

const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false
});

module.exports = sequelize;

