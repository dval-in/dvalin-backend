import express from 'express';
import bodyParser from 'body-parser';
import { config } from './config/config';
import cors from 'cors';
import { setupPassport } from './utils/passport';
import { AuthRoute } from './routes/auth/auth.routes.ts';
import { DynamicDataRoute } from './routes/data/data.routes.ts';
import { WishRoute } from './routes/wish/wish.routes.ts';
import { logToConsole } from './utils/log';
import { sendErrorResponse, sendSuccessResponse } from './handlers/response.handler.ts';
import { UserRoute } from './routes/user/user.routes.ts';
import { createServer } from 'node:http';
import { setupWebsockets } from './handlers/websocket/websocket.handler.ts';
import { setupSession } from './utils/session';
import { Server } from 'socket.io';
import { setupWorkers } from './worker/worker';
import { BKTree } from './handlers/dataStructure/BKTree';
import { isBannerServiceInitialised, setupBannerService } from './services/banner.service.ts';
import { optimizedFuzzyLCS } from './utils/fuzzyLCS.ts';

const port = config.BACKEND_PORT;
const authExcludedPaths = ['/data', '/auth'];

const app = express();
app.use(express.json({ limit: '5mb' }));
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: config.FRONTEND_URL,
		credentials: true
	}
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	cors({
		origin: config.FRONTEND_URL,
		credentials: true
	})
);

config.DEBUG && logToConsole('Server', 'Debug mode enabled');

setupSession(app);
setupPassport(app);
setupWebsockets(io);
setupBannerService();

app.use((req, res, next) => {
	const isExcluded =
		authExcludedPaths.some((path) => req.path.startsWith(path)) || req.path === '/';

	if (isExcluded || req.isAuthenticated()) {
		next();
		return;
	}

	sendErrorResponse(res, 401, 'AUTHENTICATION_REQUIRED');
});

const authRoute = new AuthRoute(app);
const dynamicDataRoute = new DynamicDataRoute(app);
const userRoute = new UserRoute(app);
const wishRoute = new WishRoute(app);

app.get('/', (req, res) => {
	if (dynamicDataRoute.isInitialised && isBannerServiceInitialised()) {
		sendSuccessResponse(res, { state: 'RUNNING' });
	} else {
		sendSuccessResponse(res, { state: 'INITIALIZING' });
	}
});

authRoute.setupRoutes();
dynamicDataRoute.setupRoutes();
userRoute.setupRoutes();
wishRoute.setupRoutes();

const bkTree = new BKTree(optimizedFuzzyLCS);
dynamicDataRoute.getDataIndex().then((data) => {
	const indexes = [...Object.keys(data.Character), ...Object.keys(data.Weapon)];
	indexes.forEach((key) => bkTree.insert(key));
	setupWorkers(bkTree, data);
});

server.listen(port, () => {
	logToConsole('Server', `listening on port ${port}`);
});
