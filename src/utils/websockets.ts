import passport, { use } from 'passport';
import { Server } from 'socket.io';
import { logToConsole } from './log';
import { session } from './session';
import { RequestHandler } from 'express';
import { WebSocketService } from '../services/websocket';
import { handleAchievements } from '../handlers/achievement';
import { getUserById } from '../db/user';
import { getGenshinAccountsByUser } from '../db/genshinAccount';

const onlyForHandshake = (middleware: RequestHandler): RequestHandler => {
	return (req, res, next) => {
		const isHandshake = req.query?.sid === undefined;
		if (isHandshake) {
			middleware(req, res, next);
		} else {
			next();
		}
	};
};

export const setupWebsockets = (io: Server) => {
	WebSocketService.setupInstance(io);
	io.engine.use(onlyForHandshake(session));
	io.engine.use(onlyForHandshake(passport.session()));

	io.on('connection', (socket) => {
		const req = socket.request as unknown as Express.Request;

		if (req.user) {
			socket.join(`user:${req.user.userId}`);
			socket.emit('authenticationState', true);
			logToConsole('WS', `${req.user.userId} connected`);
		} else {
			socket.emit('authenticationState', false);
			logToConsole('WS', 'anonymous user connected');
		}

		socket.on('addAchievement', async (data) => {
			const req = socket.request as unknown as Express.Request;
			const user = req.user;
			if (user === undefined) {
				socket.emit('error', { code: 403, message: 'UNAUTHORIZED' });
				return;
			}
			const accounts = await getGenshinAccountsByUser(user.userId);
			if (!accounts || accounts.filter((e) => e.uid === data.uid).length === 0) {
				socket.emit('error', { code: 403, message: 'UNAUTHORIZED' });
				return;
			}

			handleAchievements(socket, data);
		});

		socket.on('disconnect', () => {
			if (req.user) {
				socket.leave(`user:${req.user.userId}`);
				logToConsole('WS', `${req.user.userId} disconnected`);
			} else {
				logToConsole('WS', 'anonymous user disconnected');
			}
		});
	});
};
