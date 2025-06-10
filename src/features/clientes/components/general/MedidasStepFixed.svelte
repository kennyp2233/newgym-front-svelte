<script lang="ts">
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { calcularIMC } from '$lib/utils';
	import { TipoOcupacion } from '../../api';

	export let data: any;
	export let errors: any;
	export let touched: any;
	export let updateField: ((field: string, value: any) => void) | undefined = undefined;

	$: isNino = data.ocupacion === TipoOcupacion.NINO;

	// Convertir strings a números para el cálculo del IMC
	$: pesoNumerico = data.peso ? parseFloat(data.peso) : 0;
	$: alturaNumerico = data.altura ? parseFloat(data.altura) : 0;
	$: imcData = calcularIMC(pesoNumerico, alturaNumerico);
	$: imc = imcData ? `${imcData.imc} - ${imcData.categoria}` : 'Pendiente de cálculo';

	// Actualizar IMC en el formulario cuando cambia
	$: if (imcData && updateField) {
		if (data.imc !== imcData.imc.toString()) {
			updateField('imc', imcData.imc.toString());
		}
		if (data.categoriaPeso !== imcData.categoria) {
			updateField('categoriaPeso', imcData.categoria);
		}
	} else if (!imcData && updateField) {
		if (data.imc) {
			updateField('imc', '');
		}
		if (data.categoriaPeso) {
			updateField('categoriaPeso', '');
		}
	}

	function validateRange(value: string | number, min: number, max: number): boolean {
		if (value === null || value === undefined || value === '') return true;
		const num = typeof value === 'number' ? value : parseFloat(String(value));
		if (isNaN(num)) return false;
		return num >= min && num <= max;
	}

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

		if (isNaN(num) || num < range.min || num > range.max) {
			return `Debe estar entre ${range.min} y ${range.max} ${range.unit}`;
		}

		return '';
	}
</script>

<div class="space-y-4">
	<FormRow>
		<input type="hidden" name="imc" value={data.imc} />
		<input type="hidden" name="categoriaPeso" value={data.categoriaPeso} />

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
				label="Cuello"
				placeholder="Ej: 35.5"
				unit="cm"
				type="number"
				min={1}
				max={100}
				bind:value={data.cuello}
				{errors}
				{touched}
			/>
			<div class="w-full space-y-1.5">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="text-md font-bold text-[var(--letter)]"> IMC </label>
				<div class="relative flex items-center">
					<input
						type="text"
						class="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 text-base disabled:cursor-not-allowed disabled:opacity-50"
						value={imc}
						disabled
					/>
				</div>
				<p class="text-sm text-gray-500">Calculado automáticamente: peso / altura²</p>
			</div>
		</FormRow>
	{:else}
		<div class="w-full space-y-1.5">
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-md font-bold text-[var(--letter)]"> IMC </label>
			<div class="relative flex items-center">
				<input
					type="text"
					class="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 text-base disabled:cursor-not-allowed disabled:opacity-50"
					value={imc}
					disabled
				/>
			</div>
			<p class="text-sm text-gray-500">Calculado automáticamente: peso / altura²</p>
		</div>
	{/if}
</div>
