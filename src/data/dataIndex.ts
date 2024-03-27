import axios from "axios";
import { Index } from "../types/dataIndex";

export class DataIndex {
	private index: Index = { Character: {}, Weapon: {} };

	async initialize() {
		await this.fetchData("Character");
		await this.fetchData("Weapon");
	}

	async fetchData(type: "Character" | "Weapon") {
		const url = `https://api.github.com/repos/dval-in/dvalin-data/contents/data/EN/${type}`;
		try {
			const response = await axios.get(url);
			const files = response.data;
			for (const file of files.filter((f: { name: string }) => f.name !== "index.json")) {
				try {
					const fileResponse = await axios.get(file.download_url);
					const data = fileResponse.data;
					this.index[type][file.name.replace(".json", "")] = {
						name: data.name,
						icon: data.pictures.icon,
						rarity: data.rarity,
					};
				} catch (fileError) {
					console.error(`[server] Failed to fetch ${type} file: ${file.name}`);
				}
			}
		} catch (error) {
			console.error(`[server] Failed to fetch ${type} index: `, error);
		}
	}

	getIndex(): Index {
		return this.index;
	}
}
