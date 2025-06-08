<!-- src/features/clientes/components/individual/pagos/CompletarPagoModal.svelte -->
<script lang="ts">
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { PagoDTO } from '../../../../pagos/api';
	import type { Cliente } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	
	// Importar componentes modulares
	import { createPagoStore, pagoUtils } from '../../../../pagos/composables/pagoComposables';
	import PagoEstadoChip from '../../../../pagos/components/PagoEstadoChip.svelte';
	
	export let isOpen = false;
	export let cliente: Cliente;
	export let pagosPendientes: PagoDTO[] = [];
	export let historialPagos: PagoDTO[] = [];
	export let preselectedPago: PagoDTO | null = null;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	// Estados usando composable
	const pagoStore = createPagoStore(cliente.idCliente);
	
	let isSubmitting = false;
	let selectedPagoId = '';

	// Inicializar selectedPagoId
	$: if (preselectedPago) {
		selectedPagoId = preselectedPago.idPago!.toString();
	} else if (pagosPendientes.length > 0 && !selectedPagoId) {
		selectedPagoId = pagosPendientes[0].idPago!.toString();
	}
	
	// Obtener el pago seleccionado
	$: selectedPago = preselectedPago || pagosPendientes.find((p) => p.idPago!.toString() === selectedPagoId) || null;
	
	// Calcular montos
	$: montoRestante = selectedPago ? pagoUtils.calcularMontoRestante(selectedPago, historialPagos) : 0;
	$: montoTotalCompletarPago = selectedPago ? pagoUtils.calcularMontoTotalCompletarPago(selectedPago) : 0;	// Función de completar pago
	async function handleCompletarPago() {
		if (!selectedPago) {
			toasts.showToast('No hay pago seleccionado', 'error');
			return;
		}

		isSubmitting = true;
		
		try {
			let exito;
			// Manejar arrays de pagos pendientes de renovación
			if (Array.isArray(pagosPendientes) && pagosPendientes.length > 1) {
				const pagosRenovacion = pagosPendientes.filter(p => p.esRenovacion);
				if (pagosRenovacion.length > 0) {
					exito = await pagoStore.completarPago(selectedPago.idPago!, undefined, pagosRenovacion);
				} else {
					exito = await pagoStore.completarPago(selectedPago.idPago!);
				}
			} else {
				exito = await pagoStore.completarPago(selectedPago.idPago!);
			}
			
			if (exito) {
				onSuccess();
			}
		} finally {
			isSubmitting = false;
		}
	}

	// Generar opciones para el select
	$: pagoOptions = pagosPendientes.map((pago) => ({
		value: pago.idPago!.toString(),
		label: `${pago.inscripcion?.plan?.nombre || 'Plan no especificado'} - ${pagoUtils.formatearMonto(pago.monto)} (${pagoUtils.formatearFecha(pago.fechaPago)})`
	}));
</script>

<BaseModal {isOpen} {onClose} size="md" closeOnClickOutside>
	<svelte:fragment slot="header">
		<div class="flex items-center gap-2">
			<Icon name="check" size={20} className="text-green-600" />
			<h3 class="text-lg font-semibold">Completar Pago</h3>
		</div>
	</svelte:fragment>
	
	<div class="space-y-4">
		{#if !preselectedPago && pagosPendientes.length === 0}
			<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
				<Icon name="warning" size={24} className="mx-auto mb-2 text-yellow-600" />
				<p class="text-sm font-medium text-yellow-800">No hay pagos pendientes</p>
				<p class="text-xs text-yellow-700 mt-1">Este cliente no tiene pagos pendientes de completar.</p>
			</div>
		{:else}
			<!-- Selector de pago si hay múltiples opciones -->
			{#if !preselectedPago && pagosPendientes.length > 1}
				<div class="space-y-2">
					<label for="pago-selector" class="text-sm font-medium text-gray-700">
						Selecciona el pago a completar:
					</label>
					<Select
						id="pago-selector"
						options={pagoOptions}
						bind:value={selectedPagoId}
						placeholder="Seleccionar pago"
					/>
				</div>
			{/if}

			{#if selectedPago}
				<!-- Información resumida del pago -->
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<div class="flex items-start justify-between mb-3">
						<div>
							<h4 class="font-medium text-gray-900">
								{selectedPago.inscripcion?.plan?.nombre || 'Plan no especificado'}
							</h4>
							<p class="text-sm text-gray-600">
								Cliente: {cliente.nombre} {cliente.apellido}
							</p>
						</div>
						<PagoEstadoChip estado={selectedPago.estado || 'Pendiente'} />
					</div>

					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="text-gray-600">Monto pagado:</span>
							<div class="font-bold text-lg">{pagoUtils.formatearMonto(selectedPago.monto)}</div>
						</div>
						<div>
							<span class="text-gray-600">Monto restante:</span>
							<div class="font-bold text-lg text-red-600">{pagoUtils.formatearMonto(montoRestante)}</div>
						</div>
					</div>

					{#if montoRestante > 0}
						<div class="mt-3 pt-3 border-t border-gray-200">
							<div class="flex justify-between items-center">
								<span class="text-gray-600">Total a completar:</span>
								<span class="text-xl font-bold text-green-600">
									{pagoUtils.formatearMonto(montoTotalCompletarPago)}
								</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Nota informativa -->
				<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
					<div class="flex items-start gap-2">
						<Icon name="info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
						<div class="text-sm text-blue-700">
							<p class="font-medium">Se enviará confirmación por WhatsApp</p>
							<p class="text-xs mt-1">El cliente recibirá un mensaje automático confirmando el pago completado.</p>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<svelte:fragment slot="footer">
		<Button variant="outline" on:click={onClose}>Cancelar</Button>
		{#if selectedPago && montoRestante > 0}
			<Button variant="success" on:click={handleCompletarPago} isLoading={isSubmitting}>
				<Icon name="check" size={16} className="mr-2" />
				Completar Pago ({pagoUtils.formatearMonto(montoTotalCompletarPago)})
			</Button>
		{:else if selectedPago}
			<Button variant="outline" disabled>
				<Icon name="check" size={16} className="mr-2" />
				Pago ya completado
			</Button>
		{:else}
			<Button variant="success" disabled>
				<Icon name="check" size={16} className="mr-2" />
				Seleccionar Pago
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
