import { Server } from 'socket.io';
import { QueryKey } from '../types/websocket';

export class WebSocketService {
	private static instance: WebSocketService | undefined = undefined;

	private constructor(private io: Server) {}

	public static setupInstance(io?: Server) {
		if (!this.instance) {
			if (io !== undefined) {
				this.instance = new WebSocketService(io);
			} else {
				throw new Error('Websocket requires Socket.IO Server');
			}
		}
	}

	public static getInstance(): WebSocketService {
		if (!this.instance) {
			throw new Error('No instance setup');
		}

		return this.instance;
	}

	public invalidateQuery(userId: string, queryKey: QueryKey) {
		this.io.to(`user:${userId}`).emit('invalidateQuery', [queryKey]);
	}

	public broadcastInvalidateQuery(queryKey: QueryKey) {
		this.io.emit('invalidateQuery', { queryKey });
	}

	public sendToastMessage(userId: string, message: string, type: 'success' | 'error' | 'info') {
		this.io.to(`user:${userId}`).emit('toast', { type, message });
	}

	public broadcastSendToastMessage(message: string, type: 'success' | 'error' | 'info') {
		this.io.emit('toast', { type, message });
	}
}
