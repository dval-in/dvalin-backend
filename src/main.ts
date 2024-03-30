import express, { type Express } from 'express'
import dotenv from 'dotenv'
import { DynamicDataRoute } from './data/routes'
import { WishHistoryRoute } from './wish/routes'

dotenv.config()

const app: Express = express()
const port = process.env.PORT ?? 3000

const dynamicDataRoute = new DynamicDataRoute(app)
dynamicDataRoute.setupRoutes()

const wishHistoryRoute = new WishHistoryRoute(app)
wishHistoryRoute.setupRoutes()

app.listen(port, () => {
  console.log(`[server]: Server is running on port ${port}`)
})
