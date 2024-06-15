import passport from 'passport';
import { Server, Socket } from 'socket.io';
import { logToConsole } from '../../utils/log';
import { session } from '../../utils/session';
import { RequestHandler } from 'express';
import { WebSocketService } from '../../services/websocket.service';
import { handleAchievements } from './achievement.handler';
import { getGenshinAccountsByUser } from '../../db/models/genshinAccount';

/**
 * Middleware to apply another middleware only for handshake requests.
 *
 * @param {RequestHandler} middleware - The middleware to apply.
 * @returns {RequestHandler} - The resulting middleware.
 */
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

/**
 * Middleware to authenticate socket connections.
 *
 * @param {Socket} socket - The socket to authenticate.
 * @param {Function} next - The callback to call next middleware.
 */
const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
	const req = socket.request as unknown as Express.Request;

	if (req.user) {
		socket.user = req.user; // Attach user to socket object
		next();
	} else {
		next(new Error('Authentication error'));
	}
};

/**
 * Sets up WebSocket connections and event handlers.
 *
 * @param {Server} io - The Socket.IO server instance.
 */
export const setupWebsockets = (io: Server): void => {
	WebSocketService.setupInstance(io);
	io.engine.use(onlyForHandshake(session));
	io.engine.use(onlyForHandshake(passport.session()));

	io.use(socketAuthMiddleware); // Use middleware for socket authentication

	io.on('connection', (socket) => {
		if (socket.user) {
			socket.join(`user:${socket.user.userId}`);
			socket.emit('authenticationState', true);
			logToConsole('WS', `${socket.user.userId} connected`);
		} else {
			socket.emit('authenticationState', false);
			logToConsole('WS', 'anonymous user connected');
		}

		socket.on('addAchievement', async (data) => {
			const user = socket.user;

			if (!user) {
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
			if (socket.user) {
				socket.leave(`user:${socket.user.userId}`);
				logToConsole('WS', `${socket.user.userId} disconnected`);
			} else {
				logToConsole('WS', 'anonymous user disconnected');
			}
		});
	});
};
