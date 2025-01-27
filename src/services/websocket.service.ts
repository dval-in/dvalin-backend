import { Server } from 'socket.io';
import { QueryKey } from '../types/models/websocket';
import { Result, ok, err } from 'neverthrow';

export class WebSocketService {
	private static instance: WebSocketService | undefined = undefined;
	private readonly io: Server;

	private constructor(io: Server) {
		this.io = io;
	}

	public static setupInstance(io?: Server): Result<WebSocketService, Error> {
		if (!this.instance && io !== undefined) {
			this.instance = new WebSocketService(io);
			return ok(this.instance);
		} else {
			return err(new Error('Websocket requires Socket.IO Server'));
		}
	}

	public static getInstance(): Result<WebSocketService, Error> {
		if (!this.instance) {
			return err(new Error('No instance setup'));
		}

		return ok(this.instance);
	}

	public invalidateQuery(userId: string, queryKey: QueryKey): void {
		this.io.to(`user:${userId}`).emit('invalidateQuery', [queryKey]);
	}

	public broadcastInvalidateQuery(queryKey: QueryKey): void {
		this.io.emit('invalidateQuery', { queryKey });
	}

	public sendToastMessage(
		userId: string,
		message: string,
		type: 'success' | 'error' | 'info'
	): void {
		this.io.to(`user:${userId}`).emit('toast', { type, message });
	}

	public broadcastSendToastMessage(message: string, type: 'success' | 'error' | 'info'): void {
		this.io.emit('toast', { type, message });
	}
}
