<!-- src/features/clientes/components/general/MedidasStep.svelte -->
<script lang="ts">
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { calcularIMC } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';

	export let formData: any;
	export let errors: any;
	export let touched: any;

	const dispatch = createEventDispatcher();

	$: isNino = formData.ocupacion === 'Niño';
	$: imcData = calcularIMC(parseFloat(formData.peso || '0'), parseFloat(formData.altura || '0'));
	$: imc = imcData ? `${imcData.imc} - ${imcData.categoria}` : 'Pendiente de cálculo';

	function handlePesoChange(e: Event) {
		const target = e.target as HTMLInputElement;
		dispatch('updateField', { field: 'peso', value: target.value });
	}

	function handleAlturaChange(e: Event) {
		const target = e.target as HTMLInputElement;
		dispatch('updateField', { field: 'altura', value: target.value });
	}
</script>

<div class="space-y-4">
	<FormRow>
		<FormField
			name="peso"
			label="Peso"
			placeholder="Ej: 55"
			unit="kg"
			type="number"
			bind:value={formData.peso}
			{errors}
			{touched}
			on:input={handlePesoChange}
		/>
		<FormField
			name="altura"
			label="Altura"
			placeholder="Ej: 170"
			unit="cm"
			type="number"
			bind:value={formData.altura}
			{errors}
			{touched}
			on:input={handleAlturaChange}
		/>
	</FormRow>

	{#if !isNino}
		<FormRow>
			<FormField
				name="brazos"
				label="Brazos"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				bind:value={formData.brazos}
				{errors}
				{touched}
			/>
			<FormField
				name="pantorrillas"
				label="Pantorrillas"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				bind:value={formData.pantorrillas}
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
				bind:value={formData.gluteo}
				{errors}
				{touched}
			/>
			<FormField
				name="muslos"
				label="Muslos"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				bind:value={formData.muslos}
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
				bind:value={formData.pecho}
				{errors}
				{touched}
			/>
			<FormField
				name="cintura"
				label="Cintura"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				bind:value={formData.cintura}
				{errors}
				{touched}
			/>
		</FormRow>
	{/if}

	<div class="bg-opacity-10 mt-6 flex flex-col items-center justify-center gap-2 rounded-md p-4">
		<span>Índice de Masa Corporal (IMC)</span>
		<p class="text-center text-xl font-bold text-[var(--letter)]">
			{imc}
		</p>
	</div>
</div>
