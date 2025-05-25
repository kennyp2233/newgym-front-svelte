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
	$: imcData = calcularIMC(parseFloat(formData.peso || '0'), parseFloat(formData.altura || '0'));
	$: imc = imcData ? `${imcData.imc} - ${imcData.categoria}` : 'Pendiente de cálculo';

	function handleFieldChange(field: string) {
		return (e: Event) => {
			const target = e.target as HTMLInputElement;
			dispatch('updateField', { field, value: target.value });
		};
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
			value={formData.peso || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('peso')}
		/>
		<FormField
			name="altura"
			label="Altura"
			placeholder="Ej: 170"
			unit="cm"
			type="number"
			value={formData.altura || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('altura')}
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
	</div>
</div>
