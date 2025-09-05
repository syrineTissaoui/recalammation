import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://dbUser:123123123@reclammationdb.dcwbjp9.mongodb.net/',
  jwtSecret: process.env.JWT_SECRET || 'dev',
  jwtExpires: process.env.JWT_EXPIRES || '7d'
};
