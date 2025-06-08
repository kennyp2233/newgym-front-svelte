<!-- src/features/clientes/components/general/ResumenStepFixed.svelte -->
<script lang="ts">
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { calcularIMC } from '$lib/utils';
	import { planService, type Plan } from '../../../planes/api';
	import { calculateTotalPrice } from '../../forms/validation';
	import CuotaAnualidadField from '../../../cuotas-mantenimiento/components/CuotaAnualidadField.svelte';
	import { cuotaMantenimientoUtils } from '../../../cuotas-mantenimiento/composables/cuotaMantenimientoComposables';
	import type { CuotaMantenimientoDTO } from '../../../cuotas-mantenimiento/api';
	import { onMount } from 'svelte';
	export let data: any;
	export let errors: any;
	export let touched: any;
	export let planes: Plan[] = [];
	export let updateField: ((field: string, value: any) => void) | undefined = undefined;
	export let clienteId: number | null = null; // Para clientes existentes, null para nuevos
	$: planSeleccionado = planes.find((p) => p.idPlan === parseInt(data.idPlan || '0'));
	$: fechaFin =
		planSeleccionado && data.fechaInicio
			? planService.calcularFechaFin(data.fechaInicio, planSeleccionado.duracionMeses)
			: '';
	$: imcData = calcularIMC(parseFloat(data.peso || '0'), parseFloat(data.altura || '0'));
	$: imc = imcData ? `${imcData.imc} - ${imcData.categoria}` : 'Pendiente de cálculo';
		// Variables para manejo de anualidad usando composables
	$: incluyeAnualidad = data.incluyeAnualidad ?? true; // Por defecto incluir anualidad
	$: precioBase = planSeleccionado ? Number(planSeleccionado.precio) : 0;
	$: cuotasPendientes = []; // Se cargarían desde el servicio en un caso real
	
	// Calcular valores usando utilidades modulares
	$: desglose = cuotaMantenimientoUtils.calcularDesglosePago(precioBase, cuotasPendientes);
	$: precioTotal = incluyeAnualidad ? (precioBase + 10) : precioBase; // Simplificado para nuevos clientes
	$: montoPago = data.monto ? parseFloat(data.monto) : precioTotal;
	$: montoPendiente = Math.max(0, precioTotal - montoPago);
	$: caracteresRestantes = 150 - (data.observaciones?.length || 0);	// Función para manejar cambio de anualidad - ACTUALIZADA según documentación
	function handleAnualidadChange(incluye: boolean, monto: number) {
		if (updateField) {
			updateField('incluyeAnualidad', incluye);
			updateField('montoAnualidad', monto);
			
			// Calcular monto total según documentación
			const nuevoTotal = precioBase + (incluye ? 10 : 0);
			
			// Si incluye anualidad, el monto mínimo debe ser el total
			// Según documentación: durante registro con anualidad se debe pagar el monto completo
			if (incluye) {
				updateField('monto', nuevoTotal.toString());
				// Actualizar también el min del campo monto
				if (data.monto && parseFloat(data.monto) < nuevoTotal) {
					updateField('monto', nuevoTotal.toString());
				}
			} else {
				updateField('monto', precioBase.toString());
			}
		}
	}

	// Función específica para el evento del checkbox (para clientes nuevos)
	function handleCheckboxChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.checked;
		handleAnualidadChange(value, value ? 10 : 0);
	}

	// Validación estricta: si incluye anualidad, monto no puede ser menor al total
	$: montoMinimo = incluyeAnualidad ? precioTotal : precioBase;
	
	// Actualizar campo de monto cuando cambie el plan o la anualidad
	$: {
		if (updateField && precioTotal > 0) {
			// Si incluye anualidad, forzar el monto completo
			if (incluyeAnualidad) {
				updateField('monto', precioTotal.toString());
			} else if (!data.monto || parseFloat(data.monto) === 0) {
				updateField('monto', precioBase.toString());
			}
		}
	}
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
			</div>		</FormRow>
				<!-- Campos de pago con componente modular -->
		{#if clienteId}
			<CuotaAnualidadField
				{clienteId}
				montoPlan={precioBase}
				bind:incluyeAnualidad
				{cuotasPendientes}
				onAnualidadChange={handleAnualidadChange}
				{updateField}
			/>		{:else}
			<!-- Para clientes nuevos, mostrar versión simplificada con opciones de plan solo o plan + anualidad -->
			<div class="space-y-4">
				<div class="rounded-md bg-blue-50 p-4 border border-blue-200">
					<h4 class="font-medium text-blue-800 mb-3">Opciones de pago</h4>
					
					<!-- Opción 1: Solo Plan -->
					<div class="space-y-3">
						<label class="flex items-start space-x-3 cursor-pointer">
							<input
								type="radio"
								name="tipoPago"
								value="solo-plan"
								checked={!incluyeAnualidad}
								on:change={() => handleAnualidadChange(false, 0)}
								class="mt-1 h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)]"
							/>
							<div class="flex-1">
								<div class="font-medium text-blue-900">Solo Plan ({planSeleccionado?.nombre || 'seleccionado'})</div>
								<div class="text-sm text-blue-700">
									{cuotaMantenimientoUtils.formatearMonto(precioBase)}
								</div>
								<div class="text-xs text-blue-600 mt-1">
									El cliente pagará la cuota de mantenimiento anual por separado cuando corresponda.
								</div>
							</div>
						</label>
						
						<!-- Opción 2: Plan + Anualidad -->
						<label class="flex items-start space-x-3 cursor-pointer">
							<input
								type="radio"
								name="tipoPago"
								value="plan-anualidad"
								checked={incluyeAnualidad}
								on:change={() => handleAnualidadChange(true, 10)}
								class="mt-1 h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)]"
							/>
							<div class="flex-1">
								<div class="font-medium text-blue-900">Plan + Cuota de Mantenimiento Anual</div>
								<div class="text-sm text-blue-700">
									{cuotaMantenimientoUtils.formatearMonto(precioBase)} + {cuotaMantenimientoUtils.formatearMonto(10)} = {cuotaMantenimientoUtils.formatearMonto(precioTotal)}
								</div>
								<div class="text-xs text-blue-600 mt-1">
									Incluye el plan y la cuota de mantenimiento anual ($10.00).
								</div>
							</div>
						</label>
					</div>
				</div>
				
				<!-- Resumen del total seleccionado -->
				<div class="rounded-md bg-green-50 p-3 border border-green-200">
					<p class="font-medium text-green-800">Total a pagar:</p>
					<p class="text-lg font-bold text-green-900">{cuotaMantenimientoUtils.formatearMonto(precioTotal)}</p>
					{#if incluyeAnualidad}
						<p class="text-xs text-green-700 mt-1">
							Incluye plan ({cuotaMantenimientoUtils.formatearMonto(precioBase)}) + cuota anual ({cuotaMantenimientoUtils.formatearMonto(10)})
						</p>
					{/if}
				</div>
			</div>
		{/if}
		<FormRow>
			<FormField
				name="monto"
				label="Monto"
				type="number"
				placeholder={precioTotal ? `${precioTotal.toFixed(2)}` : '0.00'}
				unit="$"
				min={montoMinimo}
				max={precioTotal}
				step="0.01"
				helperText={incluyeAnualidad 
					? `Con anualidad el monto mínimo es: $${montoMinimo.toFixed(2)} (pago completo requerido)`
					: `Total a pagar: $${precioTotal.toFixed(2)}. Puedes ajustar el monto si el pago es parcial.`}
				bind:value={data.monto}
				{errors}
				{touched}
				disabled={incluyeAnualidad} 
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
