import express, { Express } from "express";
import dotenv from "dotenv";
import { getGachaConfigList, getWishes } from "./utils/wishImport";
import { DynamicDataRoute } from "./data/routes";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

new DynamicDataRoute(app);

app.get("/wishhistory", async (req, res) => {
	const authkey = typeof req.query.authkey === "string" ? decodeURIComponent(req.query.authkey) : null;
	let maxTime = typeof req.query.maxtime === "string" ? req.query.maxtime : "2020-09-28 00:00:00";

	if (!authkey) {
		return res.status(400).send("Missing authkey");
	}

	try {
		const configResponse = await getGachaConfigList(authkey);
		if (configResponse.retcode !== 0 || !configResponse.data) {
			return res.status(500).send("Failed to fetch gacha configuration list");
		}
		const gachaTypeList = configResponse.data.gacha_type_list;
		const wishes = await getWishes(authkey, gachaTypeList, maxTime);
		res.send(wishes);
	} catch (error) {
		console.error(error);
		res.status(500).send("An error occurred while fetching wish history");
	}
});

app.listen(port, () => {
	console.log(`[server]: Server is running on port ${port}`);
});