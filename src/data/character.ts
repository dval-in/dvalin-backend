import {Express, Request, Response} from "express";

interface test {
    [key: string]: {
        name: string,
        icon: string,
        rarity: number
    }
}

export class DataCharacterRoute {
    characterIndex: test = {}
    app: Express
    isInitialized: boolean = false

    constructor(app: Express) {
        this.app = app
        this.initialize()

        this.app.get("/data/character/index", async (req: Request, res: Response) => {
            if(this.isInitialized) {
                res.json(this.characterIndex)
            }else{

            }
        });

        this.app.get("/data/character/:name", async (req: Request, res: Response) => {
            const language = req.query.lang !== undefined ? req.query.lang : "EN"

            const response = await fetch("https://raw.githubusercontent.com/dval-in/dvalin-data/main/data/" + language + "/Character/" + req.params.name + ".json")

            if(response.ok){
                const a = await response.json()
                res.json(a)
            }else{
                console.log(response.status)
                console.log(await response.text())
                console.log("[server] data-character>fetch> character " + req.params.name + " failed")
            }
        });
    }

    async initialize() {
        console.log("[server] data-character>init> start")

        const directoryResponse = await fetch("https://api.github.com/repos/dval-in/dvalin-data/contents/data/EN/Character")

        if(directoryResponse.ok) {
            const directoryOfFiles: { name: string, download_url: string }[] = await directoryResponse.json()
            for (const file of directoryOfFiles.filter((file) => {
                return file.name !== "index.json"
            })) {
                const fileResponse = await fetch(file.download_url)

                const characterFile = await fileResponse.json()

                this.characterIndex[file.name.replace(".json", "")] = {
                    name: characterFile.name,
                    icon: characterFile.pictures.icon,
                    rarity: 5
                }
            }

            this.isInitialized = true
            console.log("[server] data-character>init> complete")
        } else{
            console.log(directoryResponse.status)
            console.log(await directoryResponse.text())
            console.log("[server] data-character>init> failed")
        }
    }
}



