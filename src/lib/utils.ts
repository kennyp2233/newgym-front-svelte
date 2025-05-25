// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Función utilitaria para combinar clases de Tailwind de manera inteligente,
 * evitando conflictos y aplicando las reglas correctamente.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Calcular IMC y categoría
 */
export function calcularIMC(peso?: number, altura?: number): { imc: number, categoria: string } | null {
    if (!peso || !altura || altura === 0) return null;

    // Altura en metros (si viene en cm)
    const alturaMetros = altura > 3 ? altura / 100 : altura;

    const imc = peso / (alturaMetros * alturaMetros);
    let categoria = '';

    if (imc < 18.5) categoria = 'Bajo peso';
    else if (imc < 25) categoria = 'Normal';
    else if (imc < 30) categoria = 'Sobrepeso';
    else categoria = 'Obesidad';

    return {
        imc: parseFloat(imc.toFixed(2)),
        categoria
    };
}

/**
 * Formatear fecha
 */
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Calcular días restantes
 */
export function calcularDiasRestantes(fechaFin: string): number {
    const fechaFinDate = new Date(fechaFin);
    const hoy = new Date();

    const diffMs = fechaFinDate.getTime() - hoy.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}