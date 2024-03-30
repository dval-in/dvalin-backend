import express from 'express'
import dotenv from 'dotenv'
import { DynamicDataRoute } from './data/routes'
import { WishHistoryRoute } from './wish/routes'
import { OAuthRoute } from './auth/routes'
import bodyParser from 'body-parser'

dotenv.config()

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))

const oAuthRoute = new OAuthRoute(app)
oAuthRoute.setupRoutes()

const dynamicDataRoute = new DynamicDataRoute(app)
dynamicDataRoute.setupRoutes()

const wishHistoryRoute = new WishHistoryRoute(app)
wishHistoryRoute.setupRoutes()

const port = process.env.PORT ?? 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
