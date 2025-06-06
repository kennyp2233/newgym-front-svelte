<!-- src/features/clientes/components/individual/pagos/CompletarPagoModal.svelte -->
<script lang="ts">
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { pagoService, type PagoDTO } from '../../../../pagos/api';
	import type { Cliente } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	import { calculateTotalPrice } from '../../../forms/validation';
	export let isOpen = false;
	export let cliente: Cliente;
	export let pagosPendientes: PagoDTO[] = [];
	export let historialPagos: PagoDTO[] = []; // Nueva prop para el historial completo
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	let isSubmitting = false;
	let selectedPagoId = '';

	// ✅ INICIALIZAR selectedPagoId cuando cambien los pagos pendientes
	$: if (pagosPendientes.length > 0 && !selectedPagoId) {
		selectedPagoId = pagosPendientes[0].idPago!.toString();
	}

	// ✅ OBTENER EL PAGO SELECCIONADO DE FORMA REACTIVA
	$: selectedPago = pagosPendientes.find((p) => p.idPago!.toString() === selectedPagoId) || null;
	// Calcular monto restante usando la nueva lógica
	function getMontoRestante(pago: PagoDTO): number {
		if (!pago.inscripcion?.plan) return 0;
		const precioTotal = calculateTotalPrice(pago.inscripcion.plan.precio, historialPagos, false);
		return precioTotal - pago.monto;
	}

	// Formatear fecha
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
	async function handleCompletarPago() {
		if (!selectedPago) {
			toasts.showToast('No hay pago seleccionado', 'error');
			return;
		}

		isSubmitting = true;
		try {
			const montoRestante = getMontoRestante(selectedPago);
			const montoTotal = selectedPago.monto + montoRestante;

			const updatedPago = await pagoService.updatePago(selectedPago.idPago!, {
				monto: montoTotal,
				estado: 'Completado',
				observaciones: `${selectedPago.observaciones || ''}. Pago completado - Monto anterior: ${selectedPago.monto.toFixed(2)}, Monto final: ${montoTotal.toFixed(2)}`
			});

			if (updatedPago) {
				toasts.showToast('Pago completado correctamente', 'success');
				onSuccess();
			}
		} catch (error) {
			console.error('Error al completar pago:', error);
			toasts.showToast('Error al completar pago', 'error');
		} finally {
			isSubmitting = false;
		}
	}

	// ✅ GENERAR OPCIONES PARA EL SELECT
	$: pagoOptions = pagosPendientes.map((pago) => ({
		value: pago.idPago!.toString(),
		label: `${pago.inscripcion?.plan?.nombre || 'Plan no especificado'} - $${pago.monto.toFixed(2)} (${formatDate(pago.fechaPago)})`
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

			<!-- ✅ SELECTOR DE PAGO SI HAY MÚLTIPLES PAGOS PENDIENTES -->
			{#if pagosPendientes.length > 1}
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Pago a completar:</label>
					<Select
						options={pagoOptions}
						bind:value={selectedPagoId}
						placeholder="Seleccionar pago"
					/>
				</div>
			{/if}

			{#if selectedPago}
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h4 class="mb-3 font-semibold text-gray-700">Detalles del Pago:</h4>

					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">Plan:</span>
							<span class="font-medium"
								>{selectedPago.inscripcion?.plan?.nombre || 'No especificado'}</span
							>
						</div>

						<div class="flex justify-between">
							<span class="text-gray-600">Fecha de pago:</span>
							<span>{formatDate(selectedPago.fechaPago)}</span>
						</div>

						{#if selectedPago.inscripcion?.fechaInicio}
							<div class="flex justify-between">
								<span class="text-gray-600">Fecha de inicio:</span>
								<span>{formatDate(selectedPago.inscripcion.fechaInicio)}</span>
							</div>
						{/if}

						{#if selectedPago.inscripcion?.fechaFin}
							<div class="flex justify-between">
								<span class="text-gray-600">Fecha de fin:</span>
								<span>{formatDate(selectedPago.inscripcion.fechaFin)}</span>
							</div>
						{/if}

						<hr class="my-3" />

						<div class="flex justify-between">
							<span class="text-gray-600">Precio del plan:</span>
							<span>${Number(selectedPago.inscripcion?.plan?.precio)?.toFixed(2) || '0.00'}</span>
						</div>

						<div class="flex justify-between">
							<span class="text-gray-600">Renovación anual:</span>
							<span>$10.00</span>
						</div>

						<div class="flex justify-between font-medium">
							<span class="text-gray-700">Total del plan:</span>
							<span>${((selectedPago.inscripcion?.plan?.precio || 0) + 10).toFixed(2)}</span>
						</div>

						<hr class="my-3" />

						<div class="flex justify-between">
							<span class="text-gray-600">Monto ya pagado:</span>
							<span>${selectedPago.monto.toFixed(2)}</span>
						</div>

						<div class="flex justify-between text-red-600">
							<span>Monto restante:</span>
							<span class="font-bold">${getMontoRestante(selectedPago).toFixed(2)}</span>
						</div>

						<div class="flex justify-between border-t pt-2 text-lg font-bold text-green-600">
							<span>Monto total final:</span>
							<span>${(selectedPago.monto + getMontoRestante(selectedPago)).toFixed(2)}</span>
						</div>
					</div>

					{#if selectedPago.referencia}
						<div class="mt-3 rounded border border-blue-200 bg-blue-50 p-2">
							<p class="text-sm text-blue-700">
								<strong>Referencia:</strong>
								{selectedPago.referencia}
							</p>
						</div>
					{/if}

					{#if selectedPago.observaciones}
						<div class="mt-3 rounded border border-gray-200 bg-gray-100 p-2">
							<p class="text-sm text-gray-700">
								<strong>Observaciones:</strong>
								{selectedPago.observaciones}
							</p>
						</div>
					{/if}
				</div>

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
				Completar Pago (${getMontoRestante(selectedPago).toFixed(2)})
			</Button>
		{:else}
			<Button variant="success" disabled>
				<Icon name="check" size={16} className="mr-2" />
				Seleccionar Pago
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
