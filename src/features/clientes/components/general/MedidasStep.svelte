<!-- src/features/clientes/components/general/MedidasStep.svelte -->
<script lang="ts">
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { calcularIMC } from '$lib/utils';
	import { TipoOcupacion } from '../../api';
	import { createEventDispatcher } from 'svelte';

	export let formData: any;
	export let errors: any;
	export let touched: any;

	const dispatch = createEventDispatcher();

	$: isNino = formData.ocupacion === TipoOcupacion.NINO;

	// Convertir strings a números para el cálculo del IMC
	$: pesoNumerico = formData.peso ? parseFloat(formData.peso) : 0;
	$: alturaNumerico = formData.altura ? parseFloat(formData.altura) : 0;
	$: imcData = calcularIMC(pesoNumerico, alturaNumerico);
	$: imc = imcData ? `${imcData.imc} - ${imcData.categoria}` : 'Pendiente de cálculo';

	function handleFieldChange(field: string) {
		return (e: Event) => {
			const target = e.target as HTMLInputElement;
			// Para campos numéricos, mantener como string pero validar que sea numérico
			let value = target.value;

			// Validación básica en tiempo real para campos numéricos
			if (
				[
					'peso',
					'altura',
					'brazos',
					'pantorrillas',
					'gluteo',
					'muslos',
					'pecho',
					'cintura',
					'cuello'
				].includes(field)
			) {
				// Permitir valores vacíos, números enteros y decimales
				if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
					// Si no es un número válido, no actualizar
					return;
				}
			}

			dispatch('updateField', { field, value });
		};
	}

	// Helper para validar rango de medidas en tiempo real
	function validateRange(value: string, min: number, max: number): boolean {
		if (!value || value.trim() === '') return true;
		const num = parseFloat(value);
		return !isNaN(num) && num >= min && num <= max;
	}

	// Determinar si mostrar advertencia de rango
	function getRangeWarning(field: string, value: string): string {
		if (!value || value.trim() === '') return '';

		const ranges: Record<string, { min: number; max: number; unit: string }> = {
			peso: { min: 1, max: 300, unit: 'kg' },
			altura: { min: 30, max: 250, unit: 'cm' },
			brazos: { min: 1, max: 200, unit: 'cm' },
			pantorrillas: { min: 1, max: 200, unit: 'cm' },
			gluteo: { min: 1, max: 200, unit: 'cm' },
			muslos: { min: 1, max: 200, unit: 'cm' },
			pecho: { min: 1, max: 200, unit: 'cm' },
			cintura: { min: 1, max: 200, unit: 'cm' },
			cuello: { min: 1, max: 100, unit: 'cm' }
		};

		const range = ranges[field];
		if (!range) return '';

		if (!validateRange(value, range.min, range.max)) {
			return `Debe estar entre ${range.min} y ${range.max} ${range.unit}`;
		}

		return '';
	}
</script>

<div class="space-y-4">
	<FormRow>
		<div class="space-y-1.5">
			<FormField
				name="peso"
				label="Peso"
				placeholder="Ej: 55.5"
				unit="kg"
				type="number"
				min={1}
				max={300}
				value={formData.peso || ''}
				{errors}
				{touched}
				on:input={handleFieldChange('peso')}
			/>
			{#if formData.peso && !validateRange(formData.peso, 1, 300)}
				<p class="text-sm text-amber-600">⚠️ {getRangeWarning('peso', formData.peso)}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<FormField
				name="altura"
				label="Altura"
				placeholder="Ej: 170"
				unit="cm"
				type="number"
				min={30}
				max={250}
				value={formData.altura || ''}
				{errors}
				{touched}
				on:input={handleFieldChange('altura')}
			/>
			{#if formData.altura && !validateRange(formData.altura, 30, 250)}
				<p class="text-sm text-amber-600">⚠️ {getRangeWarning('altura', formData.altura)}</p>
			{/if}
		</div>
	</FormRow>

	{#if !isNino}
		<FormRow>
			<FormField
				name="brazos"
				label="Brazos"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				min={1}
				max={200}
				value={formData.brazos || ''}
				{errors}
				{touched}
				on:input={handleFieldChange('brazos')}
			/>
			<FormField
				name="pantorrillas"
				label="Pantorrillas"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				min={1}
				max={200}
				value={formData.pantorrillas || ''}
				{errors}
				{touched}
				on:input={handleFieldChange('pantorrillas')}
			/>
		</FormRow>

		<FormRow>
			<FormField
				name="gluteo"
				label="Glúteo"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				min={1}
				max={200}
				value={formData.gluteo || ''}
				{errors}
				{touched}
				on:input={handleFieldChange('gluteo')}
			/>
			<FormField
				name="muslos"
				label="Muslos"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				min={1}
				max={200}
				value={formData.muslos || ''}
				{errors}
				{touched}
				on:input={handleFieldChange('muslos')}
			/>
		</FormRow>

		<FormRow>
			<FormField
				name="pecho"
				label="Pecho"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				min={1}
				max={200}
				value={formData.pecho || ''}
				{errors}
				{touched}
				on:input={handleFieldChange('pecho')}
			/>
			<FormField
				name="cintura"
				label="Cintura"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				min={1}
				max={200}
				value={formData.cintura || ''}
				{errors}
				{touched}
				on:input={handleFieldChange('cintura')}
			/>
		</FormRow>

		<FormRow>
			<FormField
				name="cuello"
				label="Cuello (Opcional)"
				placeholder="Ej: 35.5"
				unit="cm"
				type="number"
				min={1}
				max={100}
				value={formData.cuello || ''}
				{errors}
				{touched}
				on:input={handleFieldChange('cuello')}
			/>
			<div></div>
			<!-- Espacio vacío para mantener la estructura de 2 columnas -->
		</FormRow>
	{/if}

	<div
		class="bg-opacity-10 mt-6 flex flex-col items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--sections)] p-4"
	>
		<span class="text-sm font-medium text-[var(--letter)]">Índice de Masa Corporal (IMC)</span>
		<p class="text-center text-xl font-bold text-[var(--letter)]">
			{imc}
		</p>
		{#if !isNino}
			<p class="mt-2 text-center text-xs text-gray-500">
				💡 <strong>Tip:</strong> Puedes omitir las medidas detalladas si solo necesitas registrar datos
				básicos del cliente.
			</p>
		{/if}

		{#if pesoNumerico > 0 && alturaNumerico > 0}
			<div class="mt-2 text-center text-xs text-gray-500">
				<p>Peso: {pesoNumerico} kg • Altura: {alturaNumerico} cm</p>
			</div>
		{/if}
	</div>
</div>
