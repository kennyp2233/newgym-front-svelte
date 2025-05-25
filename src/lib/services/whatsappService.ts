import { api } from '$lib/services/api';

export interface WhatsAppStatus {
    status: 'connected' | 'disconnected';
    message: string;
}
export interface WhatsAppResponse {
    status: 'success' | 'error';
    message: string;
}

class WhatsAppService {
    async getStatus(): Promise<WhatsAppStatus> {
        try {
            return (await api.get('/whatsapp/status')).data;
        } catch {
            return { status: 'disconnected', message: 'Error al conectar con el servidor' };
        }
    }

    async checkConnection(): Promise<{ connected: boolean; message: string; timestamp: string }> {
        try {
            return (await api.get('/whatsapp/check-connection')).data;
        } catch {
            return {
                connected: false,
                message: 'Error al verificar conexión',
                timestamp: new Date().toISOString(),
            };
        }
    }

    async resetSession(): Promise<WhatsAppResponse> {
        try {
            return (await api.post('/whatsapp/reset')).data;
        } catch {
            return { status: 'error', message: 'Error al reiniciar la sesión' };
        }
    }

    async sendTestMessage(phoneNumber: string): Promise<WhatsAppResponse> {
        try {
            return (await api.post('/whatsapp/test-message', { phoneNumber })).data;
        } catch {
            return { status: 'error', message: 'Error al enviar mensaje de prueba' };
        }
    }
}

export const whatsappService = new WhatsAppService();
