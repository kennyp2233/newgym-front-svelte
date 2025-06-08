<!-- src/features/cuotas-mantenimiento/components/CuotaAnualidadField.svelte -->
<script lang="ts">
	import { createCuotaAnualValidator, cuotaMantenimientoUtils } from '../composables/cuotaMantenimientoComposables';
	import type { CuotaMantenimientoDTO } from '../api';
	import { onMount } from 'svelte';

	export let clienteId: number;
	export let montoPlan: number = 0;
	export let incluyeAnualidad: boolean = true;
	export let cuotasPendientes: CuotaMantenimientoDTO[] = [];
	export let onAnualidadChange: (incluye: boolean, monto: number) => void = () => {};
	export let updateField: ((field: string, value: any) => void) | undefined = undefined;

	// Inicializar validador
	const cuotaValidator = createCuotaAnualValidator(clienteId);
	const { validacion } = cuotaValidator;

	// Estados locales
	let mostrarDesglose = false;

	// Calcular desglose de pago
	$: desglose = cuotaMantenimientoUtils.calcularDesglosePago(montoPlan, cuotasPendientes);
	$: montoAnualidad = incluyeAnualidad ? 10 : 0;

	// Función para manejar cambio de anualidad
	function handleAnualidadChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.checked;
		
		incluyeAnualidad = value;
		const monto = value ? 10 : 0;
		
		// Actualizar campos del formulario
		if (updateField) {
			updateField('incluyeAnualidad', value);
			updateField('montoAnualidad', monto);
		}
		
		// Notificar al componente padre
		onAnualidadChange(value, monto);
	}

	// Validar al montar el componente
	onMount(async () => {
		await cuotaValidator.validarAnualidad();
	});
</script>

<div class="space-y-4">
	<!-- Checkbox para incluir anualidad -->
	<div class="flex items-center space-x-2">
		<input
			id="incluyeAnualidad"
			type="checkbox"
			checked={incluyeAnualidad}
			on:change={handleAnualidadChange}
			disabled={!$validacion.puede}
			class="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] disabled:opacity-50"
		/>
		<label for="incluyeAnualidad" class="text-sm font-medium text-[var(--letter)]">
			Incluir cuota de mantenimiento anual ($10.00)
		</label>
	</div>

	<!-- Mensaje de validación -->
	{#if $validacion.mensaje}
		<div class="rounded-md p-2 text-sm {$validacion.puede ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'}">
			{$validacion.mensaje}
		</div>
	{/if}

	<!-- Cuotas pendientes (si las hay) -->
	{#if cuotasPendientes.length > 0}
		<div class="rounded-md border border-orange-200 bg-orange-50 p-3">
			<h4 class="font-medium text-orange-800">Cuotas de mantenimiento pendientes:</h4>
			<ul class="mt-2 space-y-1 text-sm text-orange-700">
				{#each cuotasPendientes as cuota}
					<li>
						• Año {cuota.anio}: {cuotaMantenimientoUtils.formatearMonto(cuota.monto)}
						{#if cuota.fechaVencimiento}
							(Vence: {cuotaMantenimientoUtils.formatearFecha(cuota.fechaVencimiento)})
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Desglose de pago -->
	<div class="rounded-md bg-blue-50 p-3 text-sm">
		<div class="flex items-center justify-between">
			<p class="font-medium text-blue-800">Desglose del pago:</p>
			<button
				type="button"
				on:click={() => mostrarDesglose = !mostrarDesglose}
				class="text-blue-600 hover:text-blue-800"
			>
				{mostrarDesglose ? 'Ocultar' : 'Ver detalles'}
			</button>
		</div>
		
		<div class="mt-2 space-y-1 text-blue-700">
			<p>• Plan: {cuotaMantenimientoUtils.formatearMonto(desglose.plan)}</p>
			
			{#if cuotasPendientes.length > 0}
				<p>• Cuotas pendientes: {cuotaMantenimientoUtils.formatearMonto(desglose.cuotasPendientes)}</p>
			{/if}
			
			{#if incluyeAnualidad}
				<p>• Nueva cuota anual {new Date().getFullYear()}: {cuotaMantenimientoUtils.formatearMonto(desglose.nuevaAnualidad)}</p>
			{/if}
			
			<p class="font-medium border-t border-blue-200 pt-1">
				Total: {cuotaMantenimientoUtils.formatearMonto(desglose.total)}
			</p>
		</div>

		{#if mostrarDesglose && (cuotasPendientes.length > 0 || incluyeAnualidad)}
			<div class="mt-3 border-t border-blue-200 pt-2 text-xs text-blue-600">
				<p><strong>Nota:</strong> Las cuotas de mantenimiento anual ayudan a mantener el equipamiento del gimnasio en óptimas condiciones.</p>
			</div>
		{/if}
	</div>
</div>
