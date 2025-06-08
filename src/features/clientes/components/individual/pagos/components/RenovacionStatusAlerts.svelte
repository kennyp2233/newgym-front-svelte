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
		<!-- Sin información adicional sobre cuotas aquí -->
	</div>
{/if}
