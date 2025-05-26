<!-- src/features/clientes/components/general/MedidasStep.svelte -->
<script lang="ts">
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { calcularIMC } from '$lib/utils';
	import { TipoOcupacion } from '../../api';

	export let data: any;
	export let errors: any;
	export let touched: any;

	$: isNino = data.ocupacion === TipoOcupacion.NINO;

	// Convertir strings a números para el cálculo del IMC
	$: pesoNumerico = data.peso ? parseFloat(data.peso) : 0;
	$: alturaNumerico = data.altura ? parseFloat(data.altura) : 0;
	$: imcData = calcularIMC(pesoNumerico, alturaNumerico);
	$: imc = imcData ? `${imcData.imc} - ${imcData.categoria}` : 'Pendiente de cálculo';
	$: if (imcData) {
		data.imc = imcData.imc.toString();
		data.categoriaPeso = imcData.categoria;
	} else {
		data.imc = '';
		data.categoriaPeso = '';
	}
	function validateRange(value: string | number, min: number, max: number): boolean {
		// Permitimos valores vacíos o nulos para que no bloquee formularios opcionales
		if (value === null || value === undefined || value === '') return true;
		// Coerción a número
		const num = typeof value === 'number' ? value : parseFloat(String(value));
		if (isNaN(num)) return false;
		return num >= min && num <= max;
	}
	// Determinar si mostrar advertencia de rango
	function getRangeWarning(field: string, value: string | number): string {
		if (value === null || value === undefined || value === '') return '';
		const num = typeof value === 'number' ? value : parseFloat(String(value));

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

		// Si no es un número o está fuera de rango, retornamos la advertencia
		if (isNaN(num) || num < range.min || num > range.max) {
			return `Debe estar entre ${range.min} y ${range.max} ${range.unit}`;
		}

		return '';
	}
</script>

<div class="space-y-4">
	<FormRow>
		<input type="hidden" name="imc" bind:value={data.imc} />
		<input type="hidden" name="categoriaPeso" bind:value={data.categoriaPeso} />
		<div class="space-y-1.5">
			<FormField
				name="peso"
				label="Peso"
				placeholder="Ej: 55.5"
				unit="kg"
				type="number"
				min={1}
				max={300}
				bind:value={data.peso}
				{errors}
				{touched}
			/>
			{#if data.peso && !validateRange(data.peso, 1, 300)}
				<p class="text-sm text-amber-600">⚠️ {getRangeWarning('peso', data.peso)}</p>
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
				bind:value={data.altura}
				{errors}
				{touched}
			/>
			{#if data.altura && !validateRange(data.altura, 30, 250)}
				<p class="text-sm text-amber-600">⚠️ {getRangeWarning('altura', data.altura)}</p>
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
				bind:value={data.brazos}
				{errors}
				{touched}
			/>
			<FormField
				name="pantorrillas"
				label="Pantorrillas"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				min={1}
				max={200}
				bind:value={data.pantorrillas}
				{errors}
				{touched}
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
				bind:value={data.gluteo}
				{errors}
				{touched}
			/>
			<FormField
				name="muslos"
				label="Muslos"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				min={1}
				max={200}
				bind:value={data.muslos}
				{errors}
				{touched}
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
				bind:value={data.pecho}
				{errors}
				{touched}
			/>
			<FormField
				name="cintura"
				label="Cintura"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				min={1}
				max={200}
				bind:value={data.cintura}
				{errors}
				{touched}
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
				bind:value={data.cuello}
				{errors}
				{touched}
			/>
			<div></div>
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
