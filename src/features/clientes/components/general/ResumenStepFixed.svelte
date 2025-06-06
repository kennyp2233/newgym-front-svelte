<!-- src/features/clientes/components/general/ResumenStepFixed.svelte -->
<script lang="ts">
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { calcularIMC } from '$lib/utils';
	import { planService, type Plan } from '../../../planes/api';
	import { calculateTotalPrice } from '../../forms/validation';

	export let data: any;
	export let errors: any;
	export let touched: any;
	export let planes: Plan[] = [];
	export let updateField: ((field: string, value: any) => void) | undefined = undefined;

	$: planSeleccionado = planes.find((p) => p.idPlan === parseInt(data.idPlan || '0'));
	$: fechaFin =
		planSeleccionado && data.fechaInicio
			? planService.calcularFechaFin(data.fechaInicio, planSeleccionado.duracionMeses)
			: '';
	$: imcData = calcularIMC(parseFloat(data.peso || '0'), parseFloat(data.altura || '0'));
	$: imc = imcData ? `${imcData.imc} - ${imcData.categoria}` : 'Pendiente de cálculo';	// Calcular valores de pago (incluye renovación anual de $10 para nuevos clientes)
	$: precioBase = planSeleccionado ? Number(planSeleccionado.precio) : 0;
	$: precioTotal = planSeleccionado ? calculateTotalPrice(precioBase, [], true) : 0; // true = es cliente nuevo
	$: annualFee = precioTotal - precioBase; // Mostrar el fee por separado
	$: montoPago = data.monto ? parseFloat(data.monto) : precioTotal;
	$: montoPendiente = Math.max(0, precioTotal - montoPago);
	$: caracteresRestantes = 150 - (data.observaciones?.length || 0);
</script>

<div class="space-y-4">
	<p class="mb-4 text-sm text-gray-600">
		Revisa cuidadosamente la información antes de finalizar el registro.
	</p>

	<!-- Detalles de la membresía -->
	<div class="space-y-4 rounded-md border border-[var(--border)] bg-[var(--sections)] p-4">
		<h3 class="text-lg font-semibold text-[var(--letter)]">Detalles de la membresía</h3>

		<FormRow>
			<FormField
				name="fechaInicio"
				label="Fecha de inicio"
				type="date"
				minDate={new Date()}
				bind:value={data.fechaInicio}
				{errors}
				{touched}
			/>
			<div class="w-full space-y-1.5">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="text-md font-bold text-[var(--letter)]">Fecha de fin</label>
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

		<!-- Campos de pago -->
		<FormRow>
			<FormField
				name="monto"
				label="Monto"
				type="number"
				placeholder={precioTotal ? `${precioTotal.toFixed(2)}` : '0.00'}
				unit="$"
				min={0}
				max={precioTotal}
				step="0.01"
				helperText={annualFee > 0 
					? `Precio del plan: $${precioBase.toFixed(2)} + Renovación anual: $${annualFee.toFixed(2)} = Total: $${precioTotal.toFixed(2)}. Si no especificas un monto, se tomará el precio completo.`
					: `Precio del plan: $${precioBase.toFixed(2)}. Si no especificas un monto, se tomará el precio completo.`}
				bind:value={data.monto}
				{errors}
				{touched}
			/>
			<FormField
				name="referencia"
				label="Referencia (opcional)"
				placeholder="Ej: TRF-123456, Efectivo, etc."
				bind:value={data.referencia}
				{errors}
				{touched}
			/>
		</FormRow>

		<!-- Comentario -->
		<div class="w-full space-y-1.5">
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="text-md font-bold text-[var(--letter)]">Comentario (opcional)</label>
			<textarea
				name="comentario"
				bind:value={data.observaciones}
				class="flex min-h-[80px] w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base focus:ring-2 focus:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				placeholder="Comentarios adicionales sobre el pago o la inscripción..."
				maxlength="150"
			></textarea>
			<div class="flex justify-between">
				<p class="text-sm text-gray-500">Máximo 150 caracteres</p>
				<p class={`text-sm ${caracteresRestantes < 10 ? 'text-red-500' : 'text-gray-500'}`}>
					{caracteresRestantes} restantes
				</p>
			</div>
		</div>
	</div>

	<!-- Resumen final -->
	<div class="space-y-3 rounded-md border border-[var(--primary)] bg-[var(--primary)]/5 p-4">
		<h3 class="text-lg font-semibold text-[var(--primary)]">Resumen</h3>
		<div class="space-y-2 text-sm">
			<p class="font-medium">{data.apellido} {data.nombre} - {data.cedula}</p>
			<p>
				<strong>Plan:</strong>
				{planSeleccionado
					? `${planSeleccionado.nombre} (${planSeleccionado.duracionMeses} ${planSeleccionado.duracionMeses === 1 ? 'mes' : 'meses'})`
					: 'No seleccionado'}
			</p>
			<p><strong>Índice de Masa Corporal:</strong> {imc}</p>
			<div class="border-t pt-2">
				<p><strong>Total:</strong> ${precioTotal.toFixed(2)}</p>
				<p><strong>Monto pagado:</strong> ${montoPago.toFixed(2)}</p>
				{#if montoPendiente > 0}
					<p class="text-orange-600"><strong>Pendiente:</strong> ${montoPendiente.toFixed(2)}</p>
				{:else}
					<p class="text-green-600"><strong>Estado:</strong> Pago completo</p>
				{/if}
			</div>
		</div>
	</div>
</div>
