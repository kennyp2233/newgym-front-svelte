import { io, Socket } from 'socket.io-client';
import { env } from '$env/dynamic/public';

let socket: Socket | null = null;

export function initializeSocket() {
    if (!socket) {
        socket = io(env.PUBLIC_API_URL || 'http://localhost:3000', {
            reconnectionDelayMax: 10000,
            transports: ['websocket'],
        });
    }
    return socket;
}

export function getSocket() {
    return socket ?? initializeSocket();
}

export function onWhatsAppStatus(cb: (status: string) => void) {
    const s = getSocket();
    s.on('whatsapp:status', (d: { status: string }) => cb(d.status));
    return () => s.off('whatsapp:status');
}

export function onWhatsAppAuth(cb: (status: string) => void) {
    const s = getSocket();
    s.on('whatsapp:auth', (d: { status: string }) => cb(d.status));
    return () => s.off('whatsapp:auth');
}
