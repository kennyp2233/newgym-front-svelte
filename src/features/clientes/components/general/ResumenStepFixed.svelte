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
	$: imc = imcData ? `${imcData.imc} - ${imcData.categoria}` : 'Pendiente de cálculo';	// Variables para manejo de cuota de mantenimiento usando composables
	$: incluyeCuotaMantenimiento = data.incluyeCuotaMantenimiento ?? false; // Por defecto NO incluir cuota
	$: precioBase = planSeleccionado ? Number(planSeleccionado.precio) : 0;
	$: cuotasPendientes = []; // Se cargarían desde el servicio en un caso real
	
	// Calcular valores usando utilidades modulares
	$: desglose = cuotaMantenimientoUtils.calcularDesglosePago(precioBase, cuotasPendientes);
	$: precioTotalConAnualidad = precioBase + 10; // Plan + anualidad
	$: montoPago = data.monto ? parseFloat(data.monto) : 0;
	$: caracteresRestantes = 150 - (data.observaciones?.length || 0);	// NUEVAS REGLAS DE VALIDACIÓN FLEXIBLES - SOLO PARA EL PLAN
	$: montoMinimo = 0.01; // Mínimo para cualquier pago del plan
	$: montoMaximo = undefined; // Sin límite máximo		// Calcular pendiente según la opción seleccionada - SOLO DEL PLAN
	$: montoPendiente = Math.max(0, precioBase - montoPago);	// Función para manejar cambio de cuota de mantenimiento - SOLO AFECTA VALOR SUGERIDO
	function handleCuotaMantenimientoChange(incluye: boolean) {
		if (updateField) {
			updateField('incluyeCuotaMantenimiento', incluye);
			updateField('observacionesCuota', incluye ? '' : null);
			
			// NO cambiar el monto automáticamente, solo sugerir el valor del plan
			if (!data.monto || data.monto === '' || data.monto === '0') {
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
				<!-- Campos de pago con componente modular -->		{#if clienteId}
			<CuotaAnualidadField
				{clienteId}
				montoPlan={precioBase}
				bind:incluyeAnualidad={incluyeCuotaMantenimiento}
				{cuotasPendientes}
				onAnualidadChange={(incluye, monto) => handleCuotaMantenimientoChange(incluye)}
				{updateField}
			/>{:else}
			<!-- Para clientes nuevos, mostrar versión simplificada con opciones claras -->
			<div class="space-y-4">
				<div class="rounded-md bg-blue-50 p-4 border border-blue-200">
					<h4 class="font-medium text-blue-800 mb-3">💡 Importante</h4>					<div class="text-sm text-blue-700 bg-white p-3 rounded border border-blue-200">
						<p class="font-medium mb-2">El sistema maneja pagos por separado:</p>
						<ul class="list-disc list-inside space-y-1 text-xs">
							<li><strong>El input "Monto a pagar"</strong> es únicamente para el valor del plan</li>
							<li><strong>La cuota de mantenimiento ($10.00)</strong> se maneja automáticamente por el backend</li>
							<li><strong>Si pagas plan + cuota:</strong> Se procesan como un solo pago pero campos separados</li>
							<li><strong>Si pagas solo el plan:</strong> La cuota quedará pendiente para pagar después</li>
						</ul>
					</div>
				</div>

				<div class="space-y-3">
					<h4 class="font-medium text-gray-800">Opciones de pago:</h4>
							<!-- Opción 1: Solo Plan -->
					<label class="flex items-start space-x-3 cursor-pointer p-3 rounded border-2 transition-colors" 
						   class:border-blue-500={!incluyeCuotaMantenimiento} 
						   class:bg-blue-50={!incluyeCuotaMantenimiento}
						   class:border-gray-200={incluyeCuotaMantenimiento}>
						<input
							type="radio"
							name="tipoPago"
							value="solo-plan"
							checked={!incluyeCuotaMantenimiento}
							on:change={() => handleCuotaMantenimientoChange(false)}
							class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
						/>						<div class="flex-1">
							<div class="font-medium text-gray-900">Solo Plan: {planSeleccionado?.nombre || 'Seleccionado'}</div>
							<div class="text-sm text-gray-600">
								Precio: {cuotaMantenimientoUtils.formatearMonto(precioBase)} | Pago solo del plan
							</div>
							<div class="text-xs text-orange-600 mt-1 font-medium">
								⚠️ Cuota de mantenimiento ($10.00) quedará pendiente
							</div>
						</div>
					</label>
					
					<!-- Opción 2: Plan + Cuota de Mantenimiento -->
					<label class="flex items-start space-x-3 cursor-pointer p-3 rounded border-2 transition-colors"
						   class:border-green-500={incluyeCuotaMantenimiento} 
						   class:bg-green-50={incluyeCuotaMantenimiento}
						   class:border-gray-200={!incluyeCuotaMantenimiento}>
						<input
							type="radio"
							name="tipoPago"
							value="plan-cuota"
							checked={incluyeCuotaMantenimiento}
							on:change={() => handleCuotaMantenimientoChange(true)}
							class="mt-1 h-4 w-4 text-green-600 focus:ring-green-500"
						/>						<div class="flex-1">
							<div class="font-medium text-gray-900">Plan + Cuota de Mantenimiento</div>
							<div class="text-sm text-gray-600">
								Plan: {cuotaMantenimientoUtils.formatearMonto(precioBase)} | Cuota: {cuotaMantenimientoUtils.formatearMonto(10)} (se maneja por separado)
							</div>
							<div class="text-xs text-green-600 mt-1 font-medium">
								✅ Pagar el plan + cuota de mantenimiento al mismo tiempo
							</div>
						</div>
					</label>
				</div>
			</div>
		{/if}		<FormRow>
			<FormField
				name="monto"
				label="Monto a pagar"
				type="number"
				placeholder="0.00"
				unit="$"
				min={montoMinimo}
				max={montoMaximo}
				step="0.01"				helperText={`Monto del plan solamente. Plan completo: $${precioBase.toFixed(2)}${incluyeCuotaMantenimiento ? '. La cuota de mantenimiento ($10.00) se maneja por separado.' : ''}`}
				bind:value={data.monto}
				{errors}
				{touched}
				disabled={false}
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

		<!-- Comentario adicional para cuota de mantenimiento -->
		{#if incluyeCuotaMantenimiento}
			<div class="w-full space-y-1.5">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="text-md font-bold text-[var(--letter)]">Observaciones de cuota (opcional)</label>
				<textarea
					placeholder="Observaciones específicas para la cuota de mantenimiento..."
					class="flex min-h-[80px] w-full rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 text-base disabled:cursor-not-allowed disabled:opacity-50"
					bind:value={data.observacionesCuota}
					maxlength="150"
				></textarea>
				<p class="text-xs text-gray-500">
					{data.observacionesCuota?.length || 0}/150 caracteres
				</p>
			</div>
		{/if}
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
			<p><strong>Índice de Masa Corporal:</strong> {imc}</p>			<div class="border-t pt-2">
				<div class="space-y-1">
					{#if incluyeCuotaMantenimiento}
						<p><strong>Opción:</strong> Plan + Cuota de Mantenimiento</p>
						
						<!-- Desglose del subtotal -->
						<div class="bg-gray-50 rounded p-2 text-xs">
							<p class="font-medium mb-1">💰 Desglose del pago:</p>
							<div class="space-y-0.5">
								<div class="flex justify-between">
									<span>• Plan:</span>
									<span>${montoPago.toFixed(2)}</span>
								</div>
								<div class="flex justify-between">
									<span>• Cuota de mantenimiento:</span>
									<span>$10.00</span>
								</div>
								<div class="flex justify-between border-t pt-0.5 font-medium">
									<span>Subtotal:</span>
									<span>${(montoPago + 10).toFixed(2)}</span>
								</div>
							</div>
						</div>
						
						{#if montoPendiente > 0}
							<p class="text-orange-600"><strong>Pendiente del plan:</strong> ${montoPendiente.toFixed(2)}</p>
						{:else}
							<p class="text-green-600"><strong>Plan:</strong> Pago completo</p>
						{/if}
					{:else}
						<p><strong>Opción:</strong> Solo Plan</p>
						
						<!-- Desglose del subtotal -->
						<div class="bg-gray-50 rounded p-2 text-xs">
							<p class="font-medium mb-1">💰 Subtotal del pago:</p>
							<div class="space-y-0.5">
								<div class="flex justify-between">
									<span>• Plan:</span>
									<span>${montoPago.toFixed(2)}</span>
								</div>
								<div class="flex justify-between font-medium">
									<span>Total a pagar ahora:</span>
									<span>${montoPago.toFixed(2)}</span>
								</div>
							</div>
						</div>
						
						{#if montoPendiente > 0}
							<p class="text-orange-600"><strong>Pendiente del plan:</strong> ${montoPendiente.toFixed(2)}</p>
						{:else}
							<p class="text-green-600"><strong>Plan:</strong> Pago completo</p>
						{/if}
						<p class="text-orange-600"><strong>Cuota de mantenimiento:</strong> $10.00 (pendiente)</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
