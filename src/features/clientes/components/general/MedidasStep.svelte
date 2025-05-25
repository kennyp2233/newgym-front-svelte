<!-- src/features/clientes/components/MedidasStep.svelte -->
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
			errors={errors.peso}
			touched={touched.peso}
			on:input={handlePesoChange}
		/>
		<FormField
			name="altura"
			label="Altura"
			placeholder="Ej: 170"
			unit="cm"
			type="number"
			bind:value={formData.altura}
			errors={errors.altura}
			touched={touched.altura}
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
				errors={errors.brazos}
				touched={touched.brazos}
			/>
			<FormField
				name="pantorrillas"
				label="Pantorrillas"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				bind:value={formData.pantorrillas}
				errors={errors.pantorrillas}
				touched={touched.pantorrillas}
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
				errors={errors.gluteo}
				touched={touched.gluteo}
			/>
			<FormField
				name="muslos"
				label="Muslos"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				bind:value={formData.muslos}
				errors={errors.muslos}
				touched={touched.muslos}
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
				errors={errors.pecho}
				touched={touched.pecho}
			/>
			<FormField
				name="cintura"
				label="Cintura"
				placeholder="Ej: 55.5"
				unit="cm"
				type="number"
				bind:value={formData.cintura}
				errors={errors.cintura}
				touched={touched.cintura}
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
