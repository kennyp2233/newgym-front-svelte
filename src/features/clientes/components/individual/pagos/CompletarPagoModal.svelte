<!-- src/features/clientes/components/individual/pagos/CompletarPagoModal.svelte -->
<script lang="ts">
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { pagoService, type PagoDTO } from '../../../../pagos/api';
	import type { Cliente } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';

	export let isOpen = false;
	export let cliente: Cliente;
	export let pagosPendientes: PagoDTO[] = [];
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	let isSubmitting = false;
	let selectedPago: PagoDTO | null = null;

	$: if (pagosPendientes.length > 0 && !selectedPago) {
		selectedPago = pagosPendientes[0]; // Seleccionar el primer pago pendiente
	}

	// Calcular monto restante
	function getMontoRestante(pago: PagoDTO): number {
		if (!pago.inscripcion?.plan) return 0;
		const precioTotal = pago.inscripcion.plan.precio + 10; // +$10 renovación anual
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
		if (!selectedPago) return;

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
</script>

<BaseModal {isOpen} {onClose} size="md" closeOnClickOutside>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">Completar Pago</h3>
	</svelte:fragment>

	<div class="space-y-4">
		<p class="text-sm text-gray-600">
			¿Estás seguro de que deseas completar el pago de <strong
				>{cliente.nombre} {cliente.apellido}</strong
			>?
		</p>

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
						<span class="text-gray-600">Fecha de inicio:</span>
						<span
							>{selectedPago.inscripcion?.fechaInicio
								? formatDate(selectedPago.inscripcion.fechaInicio)
								: '-'}</span
						>
					</div>

					<div class="flex justify-between">
						<span class="text-gray-600">Fecha de fin:</span>
						<span
							>{selectedPago.inscripcion?.fechaFin
								? formatDate(selectedPago.inscripcion.fechaFin)
								: '-'}</span
						>
					</div>

					<hr class="my-3" />

					<div class="flex justify-between">
						<span class="text-gray-600">Precio del plan:</span>
						<span>${selectedPago.inscripcion?.plan?.precio?.toFixed(2) || '0.00'}</span>
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
			</div>

			<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
				<p class="text-sm text-blue-700">
					<Icon name="info" size={16} className="mr-1 inline" />
					<strong>Nota:</strong> Se enviará un mensaje automático de WhatsApp al cliente confirmando
					el pago completado.
				</p>
			</div>
		{/if}
	</div>

	<svelte:fragment slot="footer">
		<Button variant="outline" on:click={onClose}>Cancelar</Button>
		<Button variant="success" on:click={handleCompletarPago} isLoading={isSubmitting}>
			<Icon name="check" size={16} className="mr-2" />
			Completar Pago (${selectedPago ? getMontoRestante(selectedPago).toFixed(2) : '0.00'})
		</Button>
	</svelte:fragment>
</BaseModal>
