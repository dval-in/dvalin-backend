import express from 'express';
import { DynamicDataRoute } from './data/routes';
import { WishHistoryRoute } from './wish/routes';
import { OAuthRoute } from './auth/routes';
import bodyParser from 'body-parser';
import { config } from './utils/envManager';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const oAuthRoute = new OAuthRoute(app);
oAuthRoute.setupRoutes();

const authExcludedPaths = ['/data', '/auth']

app.use((req, res, next) => {
  const isExcluded = authExcludedPaths.some(path => req.path.startsWith(path)) || req.path === '/'
  if (isExcluded) {
    next(); return
  }

  if (req.isAuthenticated()) {
    next(); return
  }
  res.status(401).send('Authentication required')
})

const dynamicDataRoute = new DynamicDataRoute(app);
dynamicDataRoute.setupRoutes();

const wishHistoryRoute = new WishHistoryRoute(app);
wishHistoryRoute.setupRoutes();

const port = config.PORT;
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
