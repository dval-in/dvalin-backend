import express, { Express } from "express";
import dotenv from "dotenv";
import { DynamicDataRoute } from "./data/routes";
import { WishHistoryRoute } from "./wish/routes";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

new DynamicDataRoute(app);
new WishHistoryRoute(app);

app.listen(port, () => {
	console.log(`[server]: Server is running on port ${port}`);
});
