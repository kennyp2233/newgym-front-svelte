<!-- src/features/clientes/components/individual/pagos/HistorialPagos.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import { pagoService, type PagoDTO } from '../../../../pagos/api';
	import { toasts } from '$lib/stores/toastStore';
	import type { Cliente } from '../../../api';
	import Icon from '$lib/components/ui/Icon.svelte';
	import PagoDetailModal from './PagoDetailModal.svelte';

	export let clienteId: number;
	export let cliente: Cliente;
	export let onUpdate: () => void = () => {};
	export let key: number = 0; // Para forzar re-render desde el padre

	let pagos: PagoDTO[] = [];
	let isLoading = true;
	let showCompleteModal = false;
	let showDetailModal = false;
	let selectedPago: PagoDTO | null = null;

	// Cargar pagos del cliente
	onMount(async () => {
		await fetchPagos();
	});

	// Cargar pagos cuando cambie la key
	$: if (clienteId && key !== undefined) {
		fetchPagos();
	}

	async function fetchPagos() {
		isLoading = true;
		try {
			const data = await pagoService.getPagosByCliente(clienteId);
			pagos = data.sort(
				(a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()
			);
		} catch (error) {
			console.error('Error al cargar pagos:', error);
			toasts.showToast('Error al cargar el historial de pagos', 'error');
		} finally {
			isLoading = false;
		}
	}

	// Formatear fecha
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Formatear monto
	function formatMonto(monto: number): string {
		return `$${Number(monto).toFixed(2)}`;
	}

	// Determinar color del estado
	function getEstadoColor(estado: string): string {
		switch (estado) {
			case 'Completado':
				return 'bg-green-100 text-green-800';
			case 'Pendiente':
				return 'bg-yellow-100 text-yellow-800';
			case 'Anulado':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Determinar color del método de pago
	function getMetodoPagoColor(metodo: string): string {
		switch (metodo) {
			case 'Efectivo':
				return 'bg-green-100 text-green-800';
			case 'Transferencia':
				return 'bg-blue-100 text-blue-800';
			case 'Tarjeta':
				return 'bg-purple-100 text-purple-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Manejar completar pago
	function handleCompletePago(pago: PagoDTO) {
		if (pago.estado !== 'Pendiente') {
			toasts.showToast('Este pago ya está completado', 'info');
			return;
		}
		selectedPago = pago;
		showCompleteModal = true;
	}

	// Confirmar completar pago
	async function confirmCompletePago() {
		if (!selectedPago) return;

		isLoading = true;
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
				await fetchPagos();
				onUpdate();
			}
		} catch (error) {
			console.error('Error al completar pago:', error);
			toasts.showToast('Error al completar pago', 'error');
		} finally {
			isLoading = false;
			showCompleteModal = false;
			selectedPago = null;
		}
	}

	// Obtener el monto restante de un pago pendiente
	function getMontoRestante(pago: PagoDTO): number {
		if (!pago.inscripcion?.plan) return 0;
		const precioTotal = pago.inscripcion.plan.precio + 10; // +$10 renovación anual
		return precioTotal - pago.monto;
	}

	function handleDetailSuccess() {
		showDetailModal = false;
		selectedPago = null;
		fetchPagos();
		onUpdate();
	}

	// Calcular total de pagos
	$: totalPagos = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);

	// Configuración de columnas para la tabla
	const columns = [
		{
			key: 'fechaPago',
			header: 'Fecha',
			render: (value: string) => formatDate(value)
		},
		{
			key: 'monto',
			header: 'Monto',
			render: (value: number) => formatMonto(value)
		},
		{
			key: 'metodoPago',
			header: 'Método',
			render: (value: string) => `
        <span class="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getMetodoPagoColor(value)}">
          ${value || 'No especificado'}
        </span>
      `
		},
		{
			key: 'estado',
			header: 'Estado',
			render: (value: string) => `
        <span class="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getEstadoColor(value || 'Pendiente')}">
          ${value || 'Pendiente'}
        </span>
      `
		},
		{
			key: 'esRenovacion',
			header: 'Tipo',
			render: (value: boolean) => `
        <span class="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
          ${value ? 'Renovación' : 'Inscripción'}
        </span>
      `
		},
		{
			key: 'referencia',
			header: 'Referencia',
			render: (value: string) => value || '-'
		},
		{
			key: 'acciones',
			header: 'Acciones',
			render: (value: any, pago: PagoDTO) => {
				let buttons = `<button class="btn-view" data-id="${pago.idPago}">Ver</button>`;
				
				if (pago.estado === 'Pendiente') {
					buttons += `<button class="btn-complete" data-id="${pago.idPago}">
						<span class="inline-flex items-center">
							<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
							</svg>
							Completar
						</span>
					</button>`;
				}
				
				return buttons;
			}
		}
	];

	// Manejar clic en la tabla
	function handleTableClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const pagoId = parseInt(target.dataset.id || (target.closest('[data-id]') as HTMLElement)?.dataset.id || '');
		const pago = pagos.find((p) => p.idPago === pagoId);
		
		if (target.classList.contains('btn-view') || target.closest('.btn-view')) {
			if (pago) {
				selectedPago = pago;
				showDetailModal = true;
			}
		} else if (target.classList.contains('btn-complete') || target.closest('.btn-complete')) {
			if (pago) {
				handleCompletePago(pago);
			}
		}
	}
</script>

<div class="space-y-4">
	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
			></div>
		</div>
	{:else if pagos.length === 0}
		<div class="py-10 text-center text-gray-500">No hay pagos registrados para este cliente.</div>
	{:else}
		<!-- Resumen de pagos -->
		<div class="mb-6 flex items-center justify-between rounded-md bg-gray-50 p-4">
			<div>
				<h3 class="font-semibold text-gray-700">Total pagado:</h3>
				<p class="text-2xl font-bold text-[var(--primary)]">{formatMonto(totalPagos)}</p>
			</div>
			<div class="text-right">
				<p class="text-sm text-gray-600">Total de pagos:</p>
				<p class="text-lg font-medium">{pagos.length}</p>
			</div>
		</div>

		<!-- Tabla de pagos -->
		<Table
			data={pagos}
			{columns}
			keyExtractor={(item) => item.idPago!.toString()}
			{isLoading}
			emptyStateMessage="No hay pagos registrados para este cliente"
			rowClassName={() => 'bg-[var(--sections)] hover:bg-[var(--sections-hover)]'}
			className="rounded-lg overflow-hidden"
			on:click={handleTableClick}
		/>
	{/if}
</div>

<!-- Modal para completar pago -->
{#if showCompleteModal && selectedPago}
	<BaseModal
		isOpen={showCompleteModal}
		onClose={() => {
			showCompleteModal = false;
			selectedPago = null;
		}}
		size="md"
		closeOnClickOutside
	>
		<svelte:fragment slot="header">
			<h3 class="text-lg font-semibold">Completar Pago</h3>
		</svelte:fragment>

		<div class="p-4">
			<p class="mb-4">¿Confirmas que deseas completar este pago?</p>

			<div class="space-y-2 rounded-md bg-gray-50 p-4">
				<h4 class="font-medium">Resumen del Pago:</h4>
				<p><strong>Cliente:</strong> {cliente.nombre} {cliente.apellido}</p>
				<p><strong>Plan:</strong> {selectedPago.inscripcion?.plan?.nombre || 'No especificado'}</p>
				<p>
					<strong>Fecha de inicio:</strong>
					{selectedPago.inscripcion?.fechaInicio
						? formatDate(selectedPago.inscripcion.fechaInicio)
						: '-'}
				</p>
				<p>
					<strong>Fecha de fin:</strong>
					{selectedPago.inscripcion?.fechaFin ? formatDate(selectedPago.inscripcion.fechaFin) : '-'}
				</p>
				<hr class="my-2" />
				<p><strong>Monto ya pagado:</strong> ${selectedPago.monto.toFixed(2)}</p>
				<p><strong>Monto restante:</strong> ${getMontoRestante(selectedPago).toFixed(2)}</p>
				<p class="text-lg font-bold text-green-600">
					<strong>Monto total final:</strong> ${(
						selectedPago.monto + getMontoRestante(selectedPago)
					).toFixed(2)}
				</p>
			</div>

			<div class="mt-4 rounded-md bg-blue-50 p-3">
				<p class="text-sm text-blue-700">
					<strong>Nota:</strong> Se enviará un mensaje automático de WhatsApp al cliente confirmando
					el pago completado.
				</p>
			</div>
		</div>

		<svelte:fragment slot="footer">
			<Button
				variant="outline"
				on:click={() => {
					showCompleteModal = false;
					selectedPago = null;
				}}
			>
				Cancelar
			</Button>
			<Button variant="success" on:click={confirmCompletePago} {isLoading}>
				<Icon name="check" size={16} className="mr-2" />
				Confirmar y Completar
			</Button>
		</svelte:fragment>
	</BaseModal>
{/if}

<!-- Modal para ver/editar pago -->
{#if showDetailModal && selectedPago}
	<PagoDetailModal
		isOpen={showDetailModal}
		{cliente}
		pago={selectedPago}
		onClose={() => {
			showDetailModal = false;
			selectedPago = null;
		}}
		onSuccess={handleDetailSuccess}
	/>
{/if}

<style>
	:global(.btn-view) {
		cursor: pointer;
		border-radius: 0.25rem;
		background-color: #e0e7ff;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		color: #3730a3;
		transition: background-color 0.15s ease-in-out;
		margin-right: 0.5rem;
	}

	:global(.btn-view:hover) {
		background-color: #c7d2fe;
	}

	:global(.btn-complete) {
		display: inline-flex;
		cursor: pointer;
		align-items: center;
		border-radius: 0.25rem;
		background-color: rgb(220 252 231);
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		line-height: 1rem;
		color: rgb(22 101 52);
		transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}

	:global(.btn-complete:hover) {
		background-color: rgb(187 247 208);
	}
</style>