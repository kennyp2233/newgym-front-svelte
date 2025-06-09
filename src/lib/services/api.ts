import axios from 'axios';
import { env } from '$env/dynamic/public';

/**
 * Función recursiva para convertir strings numéricos a numbers en objetos/arrays
 */
function parseNumericStrings(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(parseNumericStrings);
    }
    
    if (typeof obj === 'object') {
        const parsed: any = {};
        for (const [key, value] of Object.entries(obj)) {
            parsed[key] = parseNumericStrings(value);
        }
        return parsed;
    }
    
    if (typeof obj === 'string') {
        // Verificar si es un string numérico válido
        if (!isNaN(Number(obj)) && obj.trim() !== '' && !isNaN(parseFloat(obj))) {
            // Preservar enteros vs decimales
            const num = Number(obj);
            return Number.isInteger(num) ? parseInt(obj, 10) : parseFloat(obj);
        }
    }
    
    return obj;
}

export const api = axios.create({
    baseURL: env.PUBLIC_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para convertir automáticamente strings numéricos a numbers
api.interceptors.response.use(
    response => {
        // Aplicar conversión automática a todos los datos de respuesta
        if (response.data) {
            response.data = parseNumericStrings(response.data);
        }
        return response;
    },
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
