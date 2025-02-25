import express, { Application } from "express";
import { sequelize, dbConnection } from "./config/database";
import { router as userRouter } from "./routes/user";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import SequelizeStoreInit from "connect-session-sequelize";
import cookieParser from "cookie-parser";
import sessionRouter from "./routes/session";
import deviceRouter from "./routes/devices";

dotenv.config();

const SequelizeStore = SequelizeStoreInit(session.Store);

const app: Application = express();

app.use(cookieParser());
app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], 
    credentials: true,
  })
);

app.use(express.json());

const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "session"
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret", 
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false, 
      httpOnly: true,
      maxAge: 1000 * 60 * 60, 
    },
  })
);

sessionStore.sync();

app.use("/", userRouter);
app.use("/sessions", sessionRouter);
app.use("/devices", deviceRouter);

app.listen(4000, async () => {
  console.log("Server is listening at port 4000");

  try {
    await sequelize
      .sync()
      .then(() => console.log("Database connected successfully!"))
      .catch((err: any) => {
        console.error("Database cannot be connected", err);
        throw new Error(err.toString());
      });
  } catch (e: any) {
    console.error(e);
    process.exit(1);
  }
});