<!-- components/RenovacionResumen.svelte -->
<script lang="ts">
	import type { Plan } from '../../../../../planes/api';

	export let planSeleccionado: Plan | null;	export let cuotasPendientes: any[] = [];
	export let form: any;

	// Función local para calcular total de cuotas
	function getTotalCuotasPendientes(cuotas: any[]): number {
		if (!cuotas || cuotas.length === 0) return 0;
		return cuotas.reduce((sum, cuota) => sum + cuota.monto, 0);
	}

	// Calcular valores separados
	$: precioPlan = planSeleccionado ? planSeleccionado.precio : 0;
	$: totalCuotas = getTotalCuotasPendientes(cuotasPendientes);
	$: montoPlanIngresado = form.monto ? parseFloat(form.monto) : 0;
</script>

{#if planSeleccionado}
	<div class="space-y-3 rounded-md border border-[var(--primary)] bg-[var(--primary)]/5 p-4">
		<h3 class="text-lg font-semibold text-[var(--primary)]">Resumen de la renovación</h3>

		<div class="space-y-2 text-sm">
			<!-- Información del plan -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="font-medium text-gray-700">Plan seleccionado:</p>
					<p class="text-[var(--primary)]">{planSeleccionado.nombre}</p>
					<p class="text-xs text-gray-500">
						{planSeleccionado.duracionMeses}
						{planSeleccionado.duracionMeses === 1 ? 'mes' : 'meses'}
					</p>
				</div>
				<div>
					<p class="font-medium text-gray-700">Precio del plan:</p>
					<p class="text-lg font-bold text-[var(--primary)]">
						${planSeleccionado.precio.toFixed(2)}
					</p>
				</div>
			</div>			<!-- Cuotas obligatorias (si las hay) -->
			{#if cuotasPendientes.length > 0}
				<div class="border-t pt-3">
					<p class="mb-2 font-medium text-gray-700">Cuotas de Mantenimiento (Obligatorias):</p>
					<div class="space-y-1">
						{#each cuotasPendientes as cuota}
							<div class="flex justify-between text-xs bg-amber-50 p-2 rounded">
								<span>• Cuota {cuota.anio}</span>
								<span class="font-medium">${cuota.monto.toFixed(2)}</span>
							</div>
						{/each}
						<div class="flex justify-between text-sm font-medium bg-amber-100 p-2 rounded">
							<span>Subtotal Cuotas:</span>
							<span>${totalCuotas.toFixed(2)}</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Desglose del pago -->
			<div class="border-t pt-3 bg-blue-50 p-3 rounded">
				<h4 class="font-medium text-blue-800 mb-2">💰 Desglose del pago:</h4>
				<div class="space-y-1 text-sm">
					<div class="flex justify-between">
						<span>Plan ({montoPlanIngresado < precioPlan ? 'Parcial' : 'Completo'}):</span>
						<span class="font-medium">${montoPlanIngresado.toFixed(2)} / ${precioPlan.toFixed(2)}</span>
					</div>
					{#if totalCuotas > 0}
					<div class="flex justify-between">
						<span>Cuotas Pendientes:</span>
						<span class="font-medium">${totalCuotas.toFixed(2)}</span>
					</div>
					{/if}
					<div class="flex justify-between border-t border-blue-300 pt-1 font-bold text-blue-800">
						<span>Total a pagar:</span>
						<span>${(montoPlanIngresado + totalCuotas).toFixed(2)}</span>
					</div>
					{#if montoPlanIngresado < precioPlan}
					<p class="text-xs text-amber-700 mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
						⚠️ Restante del plan: ${(precioPlan - montoPlanIngresado).toFixed(2)}
					</p>
					{/if}
				</div>
			</div>

			<!-- Fechas de vigencia -->
			{#if form.fechaInicio}
				<div class="border-t pt-2 text-xs text-gray-600">
					<p>Fecha de inicio: {new Date(form.fechaInicio).toLocaleDateString()}</p>
					{#if planSeleccionado}
						{@const fechaFin = new Date(form.fechaInicio)}
						{@const _ = fechaFin.setMonth(fechaFin.getMonth() + planSeleccionado.duracionMeses)}
						<p>Fecha de fin: {fechaFin.toLocaleDateString()}</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
