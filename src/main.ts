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
import { BannerRoute } from './routes/banner/banner.routes.ts';
import { setupWorkers } from './worker/worker.ts';
import { dataService } from './services/data.service.ts';
import { getBannerData } from './utils/bannerIdentifier.ts';
import { BKTree } from './handlers/dataStructure/BKTree.ts';
import { optimizedFuzzyLCS } from './utils/fuzzyLCS.ts';
import { err } from 'neverthrow';
import { bannerService } from './services/banner.service.ts';
import { ok } from 'node:assert';
import { syncUserProfileQueue } from './queues/syncUserProfile.queue.ts';
import { wishQueue } from './queues/wish.queue.ts';

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
		next();
		return;
	}

	sendErrorResponse(res, 401, 'AUTHENTICATION_REQUIRED');
});

const authRoute = new AuthRoute(app);
const dynamicDataRoute = new DynamicDataRoute(app);
const userRoute = new UserRoute(app);
const wishRoute = new WishRoute(app);
const bannerRoute = new BannerRoute(app);
let serverShouldListen = true;
const getAppStatus = () => {
	return serverShouldListen && dynamicDataRoute.isInitialized && bannerRoute.isInitialized;
};
const openConnections = new Set();
// middleware to track connections else then '/'
app.use((req, res, next) => {
	if (req.path !== '/') {
		openConnections.add(res);
	}
	res.on('finish', () => {
		if (req.path !== '/') {
			openConnections.delete(res);
		}
	});
	next();
});
const refreshData = async () => {
	Promise.all([dataService.buildIndex(), getBannerData()]).then(async (result) => {
		const bannerResult = result[1];
		if (bannerResult.isErr()) {
			return err(bannerResult.error);
		}
		const newBanners = bannerResult.value;
		const indexResult = result[0];
		const newBKTree = new BKTree(optimizedFuzzyLCS);
		if (indexResult.isErr()) {
			return err(indexResult.error);
		}
		const newIndex = indexResult.value;
		const indexes = [...Object.keys(newIndex.Character), ...Object.keys(newIndex.Weapon)];
		indexes.forEach((key) => newBKTree.insert(key));
		// pause all services and put the server in standby
		serverShouldListen = false;
		syncUserProfileQueue.pause();
		wishQueue.pause();
		// wait for all services to finish their current jobs
		while (
			openConnections.size > 0 &&
			(await syncUserProfileQueue.getActiveCount()) > 0 &&
			(await wishQueue.getActiveCount()) > 0
		) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
		// refresh the services with the new data
		dataService.refresh(newBKTree, newIndex);
		bannerService.refresh(newBanners);

		// resume the services
		serverShouldListen = true;
		syncUserProfileQueue.resume();
		wishQueue.resume();
		return ok(undefined);
	});
};

const initMiddleware = (req: Request, res: Response, next: NextFunction) => {
	if (!getAppStatus() && req.path !== '/') {
		sendErrorResponse(res, 503, 'INITIALIZING');
	}
	return next();
};

app.use(initMiddleware);

app.get('/', (_req, res) => {
	if (getAppStatus()) {
		sendSuccessResponse(res, { state: 'RUNNING' });
	} else {
		sendSuccessResponse(res, { state: 'INITIALIZING' });
	}
});

app.post('/webhook', express.json({ type: 'application/json' }), (req, res) => {
	const origin = req.headers.origin;
	if (origin.includes('api.github.com')) {
		sendErrorResponse(res, 403, 'FORBIDDEN');
	} else {
		refreshData();
		sendSuccessResponse(res, { state: 'Accepted' });
	}
});

authRoute.setupRoutes();
dynamicDataRoute.setupRoutes();
userRoute.setupRoutes();
wishRoute.setupRoutes();
bannerRoute.setupRoutes();

setupWorkers();

server.listen(port, () => {
	logToConsole('Server', `listening on port ${port}`);
});
