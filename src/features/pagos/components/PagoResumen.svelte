<script lang="ts">
	import type { PagoDTO } from '../api';
	import PagoEstadoChip from './PagoEstadoChip.svelte';
	// MetodoPagoChip removed as per new requirements - payment method no longer tracked
	import { pagoUtils } from '../composables/pagoComposables';
	import { pagoService } from '../api';
	export let pago: PagoDTO;
	export let historialPagos: PagoDTO[] = [];
	export let showPlan = true;
	export let showFechas = true;
	export let showMontosDetallados = false;
	$: montoRestante = pagoUtils.calcularMontoRestante(pago, historialPagos);
	$: tieneAsociacionCuotas = pagoService.identificarPagoConCuotas(pago);
	$: formatoPagoConCuotas = pagoService.formatearPagoConCuotas(pago);
</script>

<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
	<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
		<!-- Información básica del pago -->
		<div class="space-y-2">			<div class="flex justify-between">
				<span class="text-gray-600">Monto:</span>
				<div class="text-right">
					<span class="text-lg font-bold">{pagoUtils.formatearMonto(pago.monto)}</span>
					{#if tieneAsociacionCuotas}
						<div class="text-xs text-gray-500">
							{formatoPagoConCuotas}
						</div>
					{/if}
				</div>
			</div>

			<!-- metodoPago field removed as per new requirements -->

			<div class="flex justify-between">
				<span class="text-gray-600">Estado:</span>
				<PagoEstadoChip estado={pago.estado || 'Pendiente'} />
			</div>

			<div class="flex justify-between">
				<span class="text-gray-600">Fecha:</span>
				<span class="font-medium">{pagoUtils.formatearFecha(pago.fechaPago)}</span>
			</div>
		</div>

		<!-- Información del plan y fechas -->
		{#if showPlan && pago.inscripcion}
			<div class="space-y-2">
				<div class="flex justify-between">
					<span class="text-gray-600">Plan:</span>
					<span class="font-medium">{pago.inscripcion.plan?.nombre || 'No especificado'}</span>
				</div>

				<div class="flex justify-between">
					<span class="text-gray-600">Precio del plan:</span>
					<span class="font-medium"
						>{pagoUtils.formatearMonto(pago.inscripcion.plan?.precio || 0)}</span
					>
				</div>

				{#if showFechas}
					<div class="flex justify-between">
						<span class="text-gray-600">Inicio:</span>
						<span
							>{pago.inscripcion.fechaInicio
								? pagoUtils.formatearFecha(pago.inscripcion.fechaInicio)
								: '-'}</span
						>
					</div>

					<div class="flex justify-between">
						<span class="text-gray-600">Fin:</span>
						<span
							>{pago.inscripcion.fechaFin
								? pagoUtils.formatearFecha(pago.inscripcion.fechaFin)
								: '-'}</span
						>
					</div>
				{/if}
			</div>
		{/if}
	</div>
	<!-- Montos detallados si es necesario -->
	{#if showMontosDetallados && pago.inscripcion?.plan}
		<hr class="my-3" />
		<div class="space-y-2 text-sm">
			<div class="flex justify-between">
				<span class="text-gray-600">Precio del plan:</span>
				<span>{pagoUtils.formatearMonto(pago.inscripcion.plan.precio)}</span>
			</div>

			{#if tieneAsociacionCuotas}
				<div class="flex justify-between">
					<span class="text-gray-600">Renovación anual:</span>
					<span>$10.00</span>
				</div>

				<div class="flex justify-between font-medium">
					<span class="text-gray-700">Total del plan:</span>
					<span>{pagoUtils.formatearMonto(pago.inscripcion.plan.precio + 10)}</span>
				</div>
			{/if}

			<hr class="my-3" />

			<div class="flex justify-between">
				<span class="text-gray-600">Monto ya pagado:</span>
				<span>{pagoUtils.formatearMonto(pago.monto)}</span>
			</div>

			{#if montoRestante > 0}
				<div class="flex justify-between text-red-600">
					<span>Monto restante:</span>
					<span class="font-bold">{pagoUtils.formatearMonto(montoRestante)}</span>
				</div>

				<div class="flex justify-between border-t pt-2 text-lg font-bold text-green-600">
					<span>Monto total final:</span>
					<span>{pagoUtils.formatearMonto(pago.monto + montoRestante)}</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Referencias y observaciones -->
	{#if pago.referencia}
		<div class="mt-3 rounded border border-blue-200 bg-blue-50 p-2">
			<p class="text-sm text-blue-700">
				<strong>Referencia:</strong>
				{pago.referencia}
			</p>
		</div>
	{/if}

	{#if pago.observaciones}
		<div class="mt-3 rounded border border-gray-200 bg-gray-100 p-2">
			<p class="text-sm text-gray-700">
				<strong>Observaciones:</strong>
				{pago.observaciones}
			</p>
		</div>
	{/if}
</div>
