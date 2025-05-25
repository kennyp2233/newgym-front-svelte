<!-- src/features/clientes/components/general/ResumenStep.svelte -->
<script lang="ts">
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { calcularIMC } from '$lib/utils';
	import { planService, type Plan } from '../../../planes/api';
	import { createEventDispatcher } from 'svelte';

	export let formData: any;
	export let errors: any;
	export let touched: any;
	export let planes: Plan[] = [];

	const dispatch = createEventDispatcher();

	$: planSeleccionado = planes.find((p) => p.idPlan === parseInt(formData.idPlan || '0'));
	$: fechaFin =
		planSeleccionado && formData.fechaInicio
			? planService.calcularFechaFin(formData.fechaInicio, planSeleccionado.duracionMeses)
			: '';
	$: imcData = calcularIMC(parseFloat(formData.peso || '0'), parseFloat(formData.altura || '0'));
	$: imc = imcData ? `${imcData.imc} - ${imcData.categoria}` : 'Pendiente de cálculo';

	function handleFechaInicioChange(e: Event) {
		const target = e.target as HTMLInputElement;
		dispatch('updateField', { field: 'fechaInicio', value: target.value });
	}
</script>

<div class="space-y-4">
	<p class="mb-4 text-sm text-gray-600">
		Revisa cuidadosamente la información antes de finalizar el registro.
	</p>

	<FormRow>
		<FormField
			name="fechaInicio"
			label="Fecha de inicio"
			type="date"
			minDate={new Date()}
			bind:value={formData.fechaInicio}
			{errors}
			{touched}
			on:change={handleFechaInicioChange}
		/>
		<div class="w-full space-y-1.5">
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-md font-bold text-[var(--letter)]"> Fecha de fin </label>
			<div class="relative flex items-center">
				<input
					type="text"
					class="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 text-base disabled:cursor-not-allowed disabled:opacity-50"
					value={fechaFin}
					disabled
				/>
			</div>
			<p class="text-sm text-gray-500">Calculado automáticamente según el plan</p>
		</div>
	</FormRow>

	<div class="space-y-2 rounded-md border bg-[var(--sections)] p-3">
		<p class="font-medium">Resumen</p>
		<p>{formData.apellido} {formData.nombre} - {formData.cedula}</p>
		<p>
			Plan: {planSeleccionado
				? `${planSeleccionado.nombre} (${planSeleccionado.duracionMeses} ${planSeleccionado.duracionMeses === 1 ? 'mes' : 'meses'})`
				: 'No seleccionado'}
		</p>
		<p>Índice de Masa Corporal: {imc}</p>
		<p class="pt-2 font-bold">
			Total: ${planSeleccionado ? Number(planSeleccionado.precio).toFixed(2) : '0.00'}
		</p>
	</div>
</div>
