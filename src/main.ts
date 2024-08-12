import express, { NextFunction, Response, Request } from 'express';
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
import { setupWorkers } from './worker/worker.ts';
import { dataService } from './services/data.service.ts';

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

app.use((req, res, next) => {
	const isExcluded =
		authExcludedPaths.some((path) => req.path.startsWith(path)) || req.path === '/';

	if (isExcluded || req.isAuthenticated()) {
		return next();
	}

	return sendErrorResponse(res, 401, 'AUTHENTICATION_REQUIRED');
});

const authRoute = new AuthRoute(app);
const dynamicDataRoute = new DynamicDataRoute(app);
const userRoute = new UserRoute(app);
const wishRoute = new WishRoute(app);

const getAppStatus = () => {
	return dynamicDataRoute.isInitialized;
};

app.use((_req: Request, res: Response, next: NextFunction) => {
	if (!getAppStatus()) {
		return sendErrorResponse(res, 503, 'INITIALIZING');
	}
	return next();
});

app.get('/', (_req, res) => {
	if (getAppStatus()) {
		return sendSuccessResponse(res, { state: 'RUNNING' });
	} else {
		return sendSuccessResponse(res, { state: 'INITIALIZING' });
	}
});

app.post('/webhook', express.json({ type: 'application/json' }), (req, res) => {
	const origin = req.headers.origin;
	if (!origin.includes('api.github.com')) {
		return sendErrorResponse(res, 403, 'FORBIDDEN');
	} else {
		dataService.refreshData();
		return sendSuccessResponse(res, { state: 'Accepted' });
	}
});

authRoute.setupRoutes();
dynamicDataRoute.setupRoutes();
userRoute.setupRoutes();
wishRoute.setupRoutes();

setupWorkers();

server.listen(port, () => {
	logToConsole('Server', `listening on port ${port}`);
});
