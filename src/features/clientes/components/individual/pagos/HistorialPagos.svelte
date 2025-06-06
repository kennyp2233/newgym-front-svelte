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
	import type { TableAction } from '$lib/components/ui/Table.svelte';
	import { calculateTotalPrice } from '../../../forms/validation';

	export let clienteId: number;
	export let cliente: Cliente;
	export let onUpdate: () => void = () => {};
	export let key: number = 0; // Para forzar re-render desde el padre
	let pagos: PagoDTO[] = [];
	let isLoading = true;
	let showCompleteModal = false;
	let showDetailModal = false;	let selectedPago: PagoDTO | null = null;

	// Cargar pagos del cliente
	onMount(async () => {
		await fetchPagos();
	});

	// Cargar pagos cuando cambie la key
	$: if (clienteId && key !== undefined) {
		fetchPagos();
	}
	async function fetchPagos() {
		isLoading = true;		try {
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
	// ✅ NUEVAS FUNCIONES PARA MANEJAR ACCIONES
	function handleViewPago(pago: PagoDTO) {
		selectedPago = pago;
		showDetailModal = true;
	}
	function handleCompletePago(pago: PagoDTO) {
		const montoRestante = getMontoRestante(pago, pagos);

		if (pago.estado === 'Anulado') {
			toasts.showToast('Este pago está anulado y no se puede completar.', 'error');
			return;
		}
		
		if (montoRestante <= 0) {
			// This condition implies the payment is already complete or overpaid.
			// The button should ideally be hidden by the `getTableActions` logic.
			toasts.showToast(
				'Este pago ya está saldado o no requiere acción adicional.',
				'info'
			);
			return;
		}

		// If we reach here, there's a montoRestante > 0 and the pago is not 'Anulado'.
		selectedPago = pago;
		showCompleteModal = true;
	}

	// Función para determinar si un pago es el último (más reciente)
	function isUltimoPago(pago: PagoDTO): boolean {
		if (pagos.length === 0) return false;
		// Ordenar por fecha y tomar el más reciente
		const ultimoPago = pagos.reduce((latest, current) => {
			const latestDate = new Date(latest.fechaPago);
			const currentDate = new Date(current.fechaPago);
			return currentDate > latestDate ? current : latest;
		});
		return pago.idPago === ultimoPago.idPago;
	}	// Confirmar completar pago
	async function confirmCompletePago() {
		if (!selectedPago) return;

		isLoading = true;
		try {
			const montoRestante = getMontoRestante(selectedPago, pagos);
			const montoTotal = selectedPago.monto + montoRestante;

			const updatedPago = await pagoService.updatePago(selectedPago.idPago!, {
				monto: montoTotal,
				estado: 'Completado',
				observaciones: `${selectedPago.observaciones || ''}. Pago completado - Monto anterior: ${selectedPago.monto.toFixed(2)}, Monto final: ${montoTotal.toFixed(2)}`
			});if (updatedPago) {
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
	}	// Obtener el monto restante de un pago pendiente - Hecho reactivo
	function getMontoRestante(pago: PagoDTO, pagosList: PagoDTO[]): number {
		if (!pago.inscripcion?.plan) return 0;
		const precioTotal = calculateTotalPrice(pago.inscripcion.plan.precio, pagosList, false);
		return precioTotal - pago.monto;
	}

	function handleDetailSuccess() {
		showDetailModal = false;
		selectedPago = null;
		// Force a complete refresh of the payment data
		fetchPagos().then(() => {
			onUpdate(); // This will update the parent component
		});
	}

	// Calcular total de pagos
	$: totalPagos = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
	
	// ✅ CONFIGURACIÓN DE ACCIONES PARA LA TABLA - Mejorada para reactividad
	function getTableActions(pagosList: PagoDTO[]): TableAction<PagoDTO>[] {
		return [
			{
				label: 'Ver',
				icon: 'search',
				variant: 'outline' as const,
				onClick: handleViewPago
			},
			{
				label: 'Completar',
				icon: 'check',
				variant: 'success' as const,
				onClick: handleCompletePago,
				hidden: (pago: PagoDTO) => {
					// Button should be hidden if the payment is fully paid (or overpaid) OR if it's annulled.
					// Otherwise, it should be shown (if there's a remaining amount and not annulled).
					const montoRestante = getMontoRestante(pago, pagosList);
					return montoRestante <= 0 || pago.estado === 'Anulado';
				}
			}
		];
	}

	$: tableActions = getTableActions(pagos);

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
		}
	];
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
		</div>		<!-- ✅ TABLA CORREGIDA CON SISTEMA DE ACCIONES -->
		<Table
			data={pagos}
			{columns}
			actions={tableActions}
			keyExtractor={(item) => item.idPago!.toString()}
			{isLoading}
			emptyStateMessage="No hay pagos registrados para este cliente"
			rowClassName={() => 'bg-[var(--sections)] hover:bg-[var(--sections-hover)]'}
			className="rounded-lg overflow-hidden"
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
				<hr class="my-2" />				<p><strong>Monto ya pagado:</strong> ${selectedPago.monto.toFixed(2)}</p>
				<p><strong>Monto restante:</strong> ${getMontoRestante(selectedPago, pagos).toFixed(2)}</p>
				<p class="text-lg font-bold text-green-600">
					<strong>Monto total final:</strong> ${(
						selectedPago.monto + getMontoRestante(selectedPago, pagos)
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
		historialPagos={pagos}
		canEdit={isUltimoPago(selectedPago)}
		onClose={() => {
			showDetailModal = false;
			selectedPago = null;
		}}
		onSuccess={handleDetailSuccess}
	/>
{/if}
