import express from 'express';
import { DynamicDataRoute } from './data/routes';
import { WishHistoryRoute } from './wish/routes';
import { AuthRoute } from './auth/routes';
import bodyParser from 'body-parser';
import { config } from './utils/envManager';
import cors from 'cors';
import { setupPassport } from './utils/passport';

const port = config.BACKEND_PORT;
const authExcludedPaths = ['/data', '/auth'];

const app = express();
const authRoute = new AuthRoute(app);
const dynamicDataRoute = new DynamicDataRoute(app);
const wishHistoryRoute = new WishHistoryRoute(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

setupPassport(app);

app.use((req, res, next) => {
	const isExcluded =
		authExcludedPaths.some((path) => req.path.startsWith(path)) || req.path === '/';
	if (isExcluded) {
		next();
		return;
	}

	if (req.isAuthenticated()) {
		next();
		return;
	}
	res.status(401).send('Authentication required');
});

authRoute.setupRoutes();
dynamicDataRoute.setupRoutes();
wishHistoryRoute.setupRoutes();

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
