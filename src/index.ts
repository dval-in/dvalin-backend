import express, { Express } from "express";
import dotenv from "dotenv";
import {DataCharacterRoute} from "./data/character";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`[server]: Server is running on port ${port}`);
    new DataCharacterRoute(app)
});