import express from 'express';
import bodyParser from 'body-parser';
import { config } from './utils/envManager';
import cors from 'cors';
import { setupPassport } from './utils/passport';
import { AuthRoute } from './routes/auth/routes';
import { DynamicDataRoute } from './routes/data/routes';
import { WishHistoryRoute } from './routes/wish/routes';
import { logToConsole } from './utils/log';
import { sendErrorResponse, sendSuccessResponse } from './utils/sendResponse';
import { UserRoute } from './routes/user/routes';

const port = config.BACKEND_PORT;
const authExcludedPaths = ['/data', '/auth'];

const app = express();
const authRoute = new AuthRoute(app);
const dynamicDataRoute = new DynamicDataRoute(app);
const userRoute = new UserRoute(app);
const wishHistoryRoute = new WishHistoryRoute(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

setupPassport(app);

app.use((req, res, next) => {
	const isExcluded =
		authExcludedPaths.some((path) => req.path.startsWith(path)) || req.path === '/';

	if (isExcluded || req.isAuthenticated()) {
		next();
		return;
	}

	sendErrorResponse(res, 401, 'AUTHENTICATION_REQUIRED');
});

app.get('/', (req, res) => {
	if (dynamicDataRoute.isInitialised) {
		sendSuccessResponse(res, { state: 'RUNNING' });
	} else {
		sendSuccessResponse(res, { state: 'INITIALIZING' });
	}
});

authRoute.setupRoutes();
dynamicDataRoute.setupRoutes();
userRoute.setupRoutes();
wishHistoryRoute.setupRoutes();

app.listen(port, () => {
	logToConsole('Server', `listening on port ${port}`);
});
