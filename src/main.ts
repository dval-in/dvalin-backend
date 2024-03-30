import express from 'express'
import { DynamicDataRoute } from './data/routes'
import { WishHistoryRoute } from './wish/routes'
import { OAuthRoute } from './auth/routes'
import bodyParser from 'body-parser'
import { ConfigManager } from './utils/configManager'

const config = new ConfigManager()

const app = express()
app.set('config', config)
app.use(bodyParser.urlencoded({ extended: true }))

const oAuthRoute = new OAuthRoute(app)
oAuthRoute.setupRoutes()

const dynamicDataRoute = new DynamicDataRoute(app)
dynamicDataRoute.setupRoutes()

const wishHistoryRoute = new WishHistoryRoute(app)
wishHistoryRoute.setupRoutes()

const port = config.PORT || 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
