<!-- components/RenovacionResumen.svelte -->
<script lang="ts">
	import type { Plan } from '../../../../../planes/api';

	export let planSeleccionado: Plan | null;
	export let cuotasPendientes: any[] = [];
	export let precioTotal: number;
	export let form: any;

	// Función local para calcular total de cuotas
	function getTotalCuotasPendientes(cuotas: any[]): number {
		if (!cuotas || cuotas.length === 0) return 0;
		return cuotas.reduce((sum, cuota) => sum + cuota.monto, 0);
	}
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
			</div>

			<!-- Cuotas incluidas -->
			{#if cuotasPendientes.length > 0}
				<div class="border-t pt-3">
					<p class="mb-2 font-medium text-gray-700">Cuotas incluidas:</p>
					<div class="space-y-1">
						{#each cuotasPendientes as cuota}
							<div class="flex justify-between text-xs">
								<span>Cuota {cuota.anio}</span>
								<span>${cuota.monto.toFixed(2)}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Total a pagar -->
			<div class="border-t pt-3">
				<div class="flex items-center justify-between">
					<span class="font-bold text-gray-800">Total a pagar:</span>
					<span class="text-xl font-bold text-[var(--primary)]">${precioTotal.toFixed(2)}</span>
				</div>
				<!-- Monto ingresado diferente -->
				{#if form.monto && form.monto !== '' && !isNaN(parseFloat(form.monto)) && parseFloat(form.monto) !== precioTotal}
					<div class="mt-1 flex items-center justify-between text-sm">
						<span class="text-gray-600">Monto ingresado:</span>
						<span class="font-medium">${parseFloat(form.monto).toFixed(2)}</span>
					</div>
					{#if parseFloat(form.monto) < precioTotal}
						<p class="mt-1 text-xs text-orange-600">
							⚠️ Pago parcial - Restante: ${(precioTotal - parseFloat(form.monto)).toFixed(2)}
						</p>
					{/if}
				{/if}
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
