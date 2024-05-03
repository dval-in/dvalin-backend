import passport from 'passport';
import { Server } from 'socket.io';
import { logToConsole } from './log';
import { session } from './session';
import { RequestHandler } from 'express';
import { WebSocketService } from '../services/websocket';

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
			logToConsole('WS', `${req.user.userId} connected`);
		} else {
			logToConsole('WS', 'anonymous user connected');
		}

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
