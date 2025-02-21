"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./config/database");
const user_1 = require("./routes/user");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const connect_session_sequelize_1 = __importDefault(require("connect-session-sequelize"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const SequelizeStore = (0, connect_session_sequelize_1.default)(express_session_1.default.Store);
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express_1.default.json());
const sessionStore = new SequelizeStore({
    db: database_1.sequelize,
});
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
    },
}));
sessionStore.sync();
app.use("/", user_1.router);
app.listen(4000, async () => {
    console.log("Server is listening at port 4000");
    try {
        await database_1.sequelize
            .sync()
            .then(() => console.log("Database connected successfully!"))
            .catch((err) => {
            console.error("Database cannot be connected", err);
            throw new Error(String(err));
        });
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
});
