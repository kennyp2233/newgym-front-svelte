<!-- components/RenovacionStatusAlerts.svelte -->
<script lang="ts">
	export let pagoStoreState: boolean;
	export let renovacionState: any;
	export let cuotasPendientes: any[] = [];
	
	// Función local para calcular total de cuotas
	function getTotalCuotasPendientes(cuotas: any[]): number {
		if (!cuotas || cuotas.length === 0) return 0;
		return cuotas.reduce((sum, cuota) => sum + cuota.monto, 0);
	}
</script>

<!-- Alerta de deuda activa -->
{#if pagoStoreState}
	<div class="p-6 text-center">
		<div class="mb-4 rounded-md border border-yellow-300 bg-yellow-100 p-4">
			<h3 class="mb-2 font-bold text-yellow-800">⚠️ Deuda Activa Detectada</h3>
			<p class="text-yellow-700">
				Este cliente tiene un pago pendiente. Debe completar el pago anterior antes de renovar
				la membresía.
			</p>
		</div>
	</div>

<!-- Alerta de renovación no permitida -->
{:else if !renovacionState.puede}
	<div class="p-6 text-center">
		<div class="mb-4 rounded-md border border-red-300 bg-red-100 p-4">
			<h3 class="mb-2 font-bold text-red-800">❌ Renovación No Permitida</h3>
			<p class="text-red-700">{renovacionState.mensaje}</p>
			{#if renovacionState.diasRestantes && renovacionState.diasRestantes > 5}
				<p class="mt-2 text-sm text-red-600">
					Podrás renovar cuando falten 5 días o menos para el vencimiento.
				</p>
			{/if}
		</div>
	</div>

<!-- Estado permitido con información -->
{:else}
	<div class="space-y-4">
		<!-- Renovación permitida -->
		{#if renovacionState.diasRestantes !== undefined}
			<div class="rounded-md border border-green-200 bg-green-50 p-4">
				<h4 class="mb-2 font-bold text-green-800">✅ Renovación Permitida</h4>
				<p class="text-sm text-green-700">
					La membresía actual vence en <strong>{renovacionState.diasRestantes}</strong> días. Puedes
					proceder con la renovación.
				</p>
			</div>
		{/if}

		<!-- Cuotas pendientes -->
		{#if cuotasPendientes.length > 0}
			<div class="rounded-md border border-orange-200 bg-orange-50 p-4">
				<h4 class="mb-2 font-bold text-orange-800">⚠️ Cuotas de Mantenimiento Pendientes</h4>
				<p class="text-sm text-orange-700 mb-3">
					Se incluirán automáticamente las siguientes cuotas pendientes en el pago:
				</p>
				
				<div class="bg-white rounded border border-orange-200 p-3 space-y-2">
					{#each cuotasPendientes as cuota}
						<div class="flex justify-between items-center text-sm">
							<span class="text-orange-800">• Cuota anual {cuota.anio}</span>
							<span class="font-medium text-orange-800">${cuota.monto.toFixed(2)}</span>
						</div>
					{/each}
					<div class="border-t border-orange-200 pt-2 mt-2">
						<div class="flex justify-between items-center font-bold text-orange-800">
							<span>Total cuotas pendientes:</span>
							<span>${getTotalCuotasPendientes(cuotasPendientes).toFixed(2)}</span>
						</div>
					</div>
				</div>
				
				<p class="text-xs text-orange-600 mt-2 font-medium">
					💡 El sistema automáticamente incluirá estas cuotas en el pago de renovación.
				</p>
			</div>
		{:else}
			<!-- Sin cuotas pendientes -->
			<div class="rounded-md border border-green-200 bg-green-50 p-4">
				<h4 class="mb-2 font-bold text-green-800">✅ Sin Cuotas Pendientes</h4>
				<p class="text-sm text-green-700">
					No hay cuotas de mantenimiento pendientes. Solo se cobrará el plan seleccionado.
				</p>
			</div>
		{/if}
	</div>
{/if}
