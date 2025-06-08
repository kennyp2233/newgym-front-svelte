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
	import PagoResumen from '../../../../pagos/components/PagoResumen.svelte';

	export let isOpen = false;
	export let cliente: Cliente;
	export let pagosPendientes: PagoDTO[] = [];
	export let historialPagos: PagoDTO[] = []; // Nueva prop para el historial completo
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	// Estados usando composable
	const pagoStore = createPagoStore(cliente.idCliente);
	
	let isSubmitting = false;
	let selectedPagoId = '';

	// ✅ INICIALIZAR selectedPagoId cuando cambien los pagos pendientes
	$: if (pagosPendientes.length > 0 && !selectedPagoId) {
		selectedPagoId = pagosPendientes[0].idPago!.toString();
	}

	// ✅ OBTENER EL PAGO SELECCIONADO DE FORMA REACTIVA
	$: selectedPago = pagosPendientes.find((p) => p.idPago!.toString() === selectedPagoId) || null;
	
	// Usar utilidades modulares
	$: montoRestante = selectedPago ? pagoUtils.calcularMontoRestante(selectedPago, historialPagos) : 0;

	// Función de completar pago usando composable
	async function handleCompletarPago() {
		if (!selectedPago) {
			toasts.showToast('No hay pago seleccionado', 'error');
			return;
		}

		isSubmitting = true;
		const exito = await pagoStore.completarPago(selectedPago.idPago!);
		
		if (exito) {
			onSuccess();
		}
		isSubmitting = false;
	}

	// ✅ GENERAR OPCIONES PARA EL SELECT
	$: pagoOptions = pagosPendientes.map((pago) => ({
		value: pago.idPago!.toString(),
		label: `${pago.inscripcion?.plan?.nombre || 'Plan no especificado'} - ${pagoUtils.formatearMonto(pago.monto)} (${pagoUtils.formatearFecha(pago.fechaPago)})`
	}));
</script>

<BaseModal {isOpen} {onClose} size="md" closeOnClickOutside>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">Completar Pago Pendiente</h3>
	</svelte:fragment>

	<div class="space-y-4">
		{#if pagosPendientes.length === 0}
			<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
				<p class="text-sm text-yellow-700">
					<Icon name="warning" size={16} className="mr-1 inline" />
					<strong>No hay pagos pendientes</strong> para este cliente.
				</p>
			</div>
		{:else}
			<p class="text-sm text-gray-600">
				Selecciona el pago pendiente que deseas completar para <strong
					>{cliente.nombre} {cliente.apellido}</strong
				>:
			</p>

			<!-- ✅ SELECTOR DE PAGO SI HAY MÚLTIPLES PAGOS PENDIENTES -->			{#if pagosPendientes.length > 1}
				<div class="space-y-2">
					<label for="pago-selector" class="text-sm font-medium text-gray-700">Pago a completar:</label>
					<Select
						id="pago-selector"
						options={pagoOptions}
						bind:value={selectedPagoId}
						placeholder="Seleccionar pago"
					/>
				</div>
			{/if}			{#if selectedPago}
				<!-- Usar componente modular para mostrar detalles del pago -->
				<PagoResumen 
					pago={selectedPago} 
					{historialPagos}
					showMontosDetallados={true}
				/>

				<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
					<p class="text-sm text-blue-700">
						<Icon name="info" size={16} className="mr-1 inline" />
						<strong>Nota:</strong> Se enviará un mensaje automático de WhatsApp al cliente confirmando
						el pago completado.
					</p>
				</div>
			{/if}
		{/if}
	</div>
	<svelte:fragment slot="footer">
		<Button variant="outline" on:click={onClose}>Cancelar</Button>
		{#if selectedPago}
			<Button variant="success" on:click={handleCompletarPago} isLoading={isSubmitting}>
				<Icon name="check" size={16} className="mr-2" />
				Completar Pago ({pagoUtils.formatearMonto(montoRestante)})
			</Button>
		{:else}
			<Button variant="success" disabled>
				<Icon name="check" size={16} className="mr-2" />
				Seleccionar Pago
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
