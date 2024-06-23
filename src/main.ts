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
import { createServer } from 'node:http';
import { setupWebsockets } from './utils/websockets';
import { setupSession } from './utils/session';
import { Server } from 'socket.io';
import { setupWorkers } from './worker/worker';
import { BKTree } from './utils/BKTree';
import { optimizedLevenshteinDistance } from './utils/levenshteinDistance';
import { setupBannerService } from './services/bannerData';

const port = config.BACKEND_PORT;
const authExcludedPaths = ['/data', '/auth'];

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: config.FRONTEND_URL,
		credentials: true
	}
});

const authRoute = new AuthRoute(app);
const dynamicDataRoute = new DynamicDataRoute(app);
const userRoute = new UserRoute(app);
const wishHistoryRoute = new WishHistoryRoute(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	cors({
		origin: config.FRONTEND_URL,
		credentials: true
	})
);

setupSession(app);
setupPassport(app);
setupWebsockets(io);
const bannerService = setupBannerService();

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
	if (dynamicDataRoute.isInitialised && bannerService.isInitialised) {
		sendSuccessResponse(res, { state: 'RUNNING' });
	} else {
		sendSuccessResponse(res, { state: 'INITIALIZING' });
	}
});

authRoute.setupRoutes();
dynamicDataRoute.setupRoutes();
userRoute.setupRoutes();
wishHistoryRoute.setupRoutes();

const bkTree = new BKTree(optimizedLevenshteinDistance);
dynamicDataRoute.getDataIndex().then((data) => {
	const indexes = [...Object.keys(data.Character), ...Object.keys(data.Weapon)];
	indexes.forEach((key) => bkTree.insert(key));
	bkTree.isInitialised = true;
});

setupWorkers(bkTree, bannerService);

server.listen(port, () => {
	logToConsole('Server', `listening on port ${port}`);
});
