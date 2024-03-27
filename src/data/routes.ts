import { Express, Request, Response } from "express";
import { queryGitHubFile } from "../utils/github";
import { fileNameMapper, folderNameMapper, referenceMapper } from "../utils/mapper";
import { Folder } from "./fileReference";

export class DynamicDataRoute {
	app: Express;

	constructor(app: Express) {
		this.app = app;
		this.setupRoutes();
	}

	setupRoutes() {
		this.app.get("/data", async (req: Request, res: Response) => {
			try {
				res.json(Folder);
			} catch (error) {
				console.error(`[server] data>fetch> index failed`, error);
				res.status(500).send("Internal server error.");
			}
		});
		this.app.get("/data/:dataType/index", async (req: Request, res: Response) => {
			const dataType = req.params.dataType;
			const language = "EN";
			try {
				const folder = folderNameMapper(dataType);
				const file = fileNameMapper("index", dataType);
				const index = await queryGitHubFile(language, folder, file);
				res.json(index);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("does not exist in the data repository")) {
						console.warn(`[server] data not found:`, dataType, "index");
						res.status(404).send("Not found.");
					} else {
						console.error(`[server] data-${dataType} fetch index failed:`, error);
						res.status(500).send("Internal server error.");
					}
				}
			}
		});
		this.app.get("/data/:dataType", async (req: Request, res: Response) => {
			const dataType = req.params.dataType;
			try {
				const index = referenceMapper(dataType);
				res.json(index);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("does not exist in the data repository")) {
						console.warn(`[server] data not found:`, dataType);
						res.status(404).send("Not found.");
					} else {
						console.error(`[server] data-${dataType} fetch index failed:`, error);
						res.status(500).send("Internal server error.");
					}
				}
			}
		});
		this.app.get("/data/:dataType/:name", async (req: Request, res: Response) => {
			const { dataType, name } = req.params;
			const language = req.query.lang ? req.query.lang.toString() : "EN";
			try {
				const folder = folderNameMapper(dataType);
				const file = fileNameMapper(name, dataType);
				const data = await queryGitHubFile(language, folder, file);
				res.json(data);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("does not exist in the data repository")) {
						console.warn(`[server] data not found:`, dataType, name);
						res.status(404).send("Not found.");
					} else {
						console.error(`[server] data-${dataType} fetch index failed:`, error);
						res.status(500).send("Internal server error.");
					}
				}
			}
		});
	}
}
