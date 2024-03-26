import express, { Express } from "express";
import dotenv from "dotenv";
import { getGachaConfigList, getWishes } from "./utils/wishImport";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`[server]: Server is running on port ${port}`);
});
// exemple request : http://localhost:3000/wishhistory?authkey=MYO%2BmxJzieyA8xPITwQSZCl%2BMFm1fMrf9zZ9e4IIKaPrjlGnTw4U2nMOH4YTKYhKXf2d4NEPh5Vap49rDhGpku4aqm2etwVDaw5pfYEYj238xSWAddGBvJWVehL%2Bq3LbLsFmyE3RAfNbta0gx3uvhV3mh9WJwiAROswnNPw%2F4Ug7NlXkV7gwHfMmXu62%2BP8%2BbCs7ZTzDlnDnPfkYDVWl0Sw4avQOr5O8PDhtMdPKQHG23RbFlW7rVHEkbhBQJt%2FKjMpT%2BrJbTtjIIayI6u5TdX0kxGtZ3Xw8mGc9WLuvb3u9tnszG57X7Lv9AoKjk5B%2Fql02q0ZAFUZ%2F92qOjZykAyEK53179tIe7476EZGhYjRVHunwDII19iNa%2FqJMLXHN7VRccuLF7kFtzQskKkaZErd%2FN1SgasSCwJ%2Bt4FLONGqMg86l6WgAtOFpXxJxjJqTdVCo9NglH0JGN7v843S5QsrU%2FxuT4nMWG%2FqPIvWu2sLmPv5fE0UmWc2c7hzs13T2Q8Yu%2Bv3PcZ%2FkmPzhF8Oyjm0vh%2BJ3J%2FiTiHf2QNicTSONzenqswnwDP60oo5qXLE1DPySufQQ9%2BGJLHfsSPj46wd7yPQekc5tz0kKw4B75NP9GbMI6CDMccsYAheZCZrIWPKaazWaipg%2FLPL4DFLI9UbqCoLtfAeFZEpUxU8QTepmkMaak1bD1wnM53LivQoxmuYcVjIWOusRhPPlkceGYD1oSAhY3SAbUCT1SX9DkY0IZiiN5Nr3ZRSqao1yxWk6gwUSmrN85pPikf4vtaLXCR%2Fs1NAfnJbBwlAcAw8uyK31fhHETFRgxcnaYjVOEuSrhq32ezgvpnxlfwfozyZK4PHlEwXgbXcduU3c%2Fo6%2FjJmbCixOO9Th21mYsoZEj8p%2BD568bENq03nSY86Cpjd%2BmbHQtZXFXOD4yLafNTskgy12EZQdUxnG7vCxKrSUbmvwntiFzSxr6xhXw%2FyOLvzkw403ny3gfXFFWAlVIdK8uR5%2Bev8a3M5zuCSC9Y2mHPTb&maxtime=%222024-03-11%2021:07:47%22
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
