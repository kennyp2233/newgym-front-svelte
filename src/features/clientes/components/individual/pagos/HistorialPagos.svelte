<!-- src/features/clientes/components/individual/pagos/HistorialPagos.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import type { PagoDTO } from '../../../../pagos/api';
	import { pagoService } from '../../../../pagos/api';
	import type { Cliente } from '../../../api';
	import Icon from '$lib/components/ui/Icon.svelte';
	import PagoDetailModal from './PagoDetailModal.svelte';
	import type { TableAction } from '$lib/components/ui/Table.svelte';
	import { createPagoStore, pagoUtils } from '../../../../pagos/composables/pagoComposables';
	import PagoEstadoChip from '../../../../pagos/components/PagoEstadoChip.svelte';
	import MetodoPagoChip from '../../../../pagos/components/MetodoPagoChip.svelte';
	import PagoResumen from '../../../../pagos/components/PagoResumen.svelte';
	export let clienteId: number;
	export let cliente: Cliente;
	export let onUpdate: () => void = () => {};
	export let key: number = 0; // Para forzar re-render desde el padre
	export let cuotasPendientesGlobales: any[] = []; // NUEVO: Cuotas pendientes para identificación
		// Estados usando el composable
	const pagoStore = createPagoStore(clienteId);
	const { pagos, pagosPendientes, totalPagado, isLoading } = pagoStore;
	let showCompleteModal = false;
	let showDetailModal = false;
	let selectedPago: PagoDTO | null = null;
	// Cargar pagos del cliente
	onMount(async () => {
		await pagoStore.cargarPagos();
	});

	// Cargar pagos cuando cambie la key
	$: if (clienteId && key !== undefined) {
		pagoStore.cargarPagos();
	}	// ✅ NUEVAS FUNCIONES PARA MANEJAR ACCIONES - Refactorizadas
	function handleViewPago(pago: PagoDTO) {
		selectedPago = pago;
		showDetailModal = true;
	}
		function handleCompletePago(pago: PagoDTO) {
		const montoRestante = pagoUtils.calcularMontoRestante(pago, $pagos);

		if (pago.estado === 'Anulado') {
			return;
		}
		
		if (montoRestante <= 0) {
			return;
		}

		selectedPago = pago;
		showCompleteModal = true;
	}

	// Confirmar completar pago - Simplificado usando el composable
	async function confirmCompletePago() {
		if (!selectedPago) return;

		const exito = await pagoStore.completarPago(selectedPago.idPago!);
		if (exito) {
			onUpdate();
		}
		
		showCompleteModal = false;
		selectedPago = null;
	}

	function handleDetailSuccess() {
		showDetailModal = false;
		selectedPago = null;
		onUpdate(); // Actualizar componente padre
	}	// Calcular total de pagos - Usando datos del store
	$: totalPagos = $totalPagado;
	
	// ✅ CONFIGURACIÓN DE ACCIONES PARA LA TABLA - Simplificada
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
					const montoRestante = pagoUtils.calcularMontoRestante(pago, pagosList);
					return montoRestante <= 0 || pago.estado === 'Anulado';
				}
			}
		];
	}

	$: tableActions = getTableActions($pagos);	// Configuración de columnas para la tabla - Usando componentes modulares
	const columns = [
		{
			key: 'fechaPago',
			header: 'Fecha',
			render: (value: string) => pagoUtils.formatearFecha(value)		},		{
			key: 'monto',
			header: 'Monto',
			render: (value: number, pago: PagoDTO) => {
				// Usar el nuevo método para identificar y formatear pagos con cuotas según documentación
				if (pagoService.identificarPagoConCuotas(pago, cuotasPendientesGlobales)) {
					return pagoService.formatearPagoConCuotas(pago);
				}
				return pagoUtils.formatearMonto(value);
			}
		},
		{
			key: 'metodoPago',
			header: 'Método'
			// Se renderizará en el template
		},
		{
			key: 'estado',
			header: 'Estado'
			// Se renderizará en el template
		},		{
			key: 'esRenovacion',
			header: 'Tipo'
		},
		{
			key: 'referencia',
			header: 'Referencia',
			render: (value: string) => value || '-'
		}
	];
</script>

<div class="space-y-4">	{#if $isLoading}
		<div class="flex h-64 items-center justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
			></div>
		</div>
	{:else if $pagos.length === 0}
		<div class="py-10 text-center text-gray-500">No hay pagos registrados para este cliente.</div>
	{:else}
		<!-- Resumen de pagos -->
		<div class="mb-6 flex items-center justify-between rounded-md bg-gray-50 p-4">
			<div>
				<h3 class="font-semibold text-gray-700">Total pagado:</h3>
				<p class="text-2xl font-bold text-[var(--primary)]">{pagoUtils.formatearMonto(totalPagos)}</p>
			</div>
			<div class="text-right">
				<p class="text-sm text-gray-600">Total de pagos:</p>
				<p class="text-lg font-medium">{$pagos.length}</p>
			</div>
		</div>		<!-- ✅ TABLA CON SISTEMA DE ACCIONES MODULAR -->
		<div class="w-full overflow-x-auto rounded-lg">
			<table class="w-full border-collapse bg-[var(--sections)]">
				<thead class="bg-[var(--sections-hover)] text-left">
					<tr>
						{#each columns as col}
							<th class="border-b border-[var(--border)] p-3 font-bold text-[var(--letter)]">
								{col.header}
							</th>
						{/each}
						{#if tableActions.length > 0}
							<th class="border-b border-[var(--border)] p-3 text-right">Acciones</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each $pagos as pago, i (pago.idPago)}
						<tr class="bg-[var(--sections)] hover:bg-[var(--sections-hover)]">
							{#each columns as col}								<td class="max-w-0 truncate border-b border-[var(--border)] p-3 text-[var(--letter)]">									{#if col.key === 'fechaPago'}
										{pagoUtils.formatearFecha(pago.fechaPago)}
									{:else if col.key === 'monto'}
										{#if pagoService.identificarPagoConCuotas(pago, cuotasPendientesGlobales)}
											{@html pagoService.formatearPagoConCuotas(pago)}
										{:else}
											{pagoUtils.formatearMonto(pago.monto)}
										{/if}
									{:else if col.key === 'metodoPago'}
										<MetodoPagoChip metodo={pago.metodoPago || 'No especificado'} />
									{:else if col.key === 'estado'}
										<PagoEstadoChip estado={pago.estado || 'Pendiente'} />									{:else if col.key === 'esRenovacion'}
										<span class="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap {pago.esRenovacion ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
											{pago.esRenovacion ? 'Renovación' : 'Inscripción'}
										</span>
									{:else if col.key === 'referencia'}
										{pago.referencia || '-'}
									{/if}
								</td>
							{/each}
							{#if tableActions.length > 0}
								<td class="border-b border-[var(--border)] p-3 text-right">
									<div class="flex items-center justify-end gap-2">
										{#each tableActions.filter(action => !action.hidden?.(pago)) as action}
											<Button
												variant={action.variant || 'outline'}
												size="sm"
												disabled={action.disabled?.(pago) || false}
												on:click={() => action.onClick(pago)}
											>
												{#if action.icon}
													<Icon name={action.icon} size={16} className="mr-1" />
												{/if}
												{action.label}
											</Button>
										{/each}
									</div>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
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
			<p class="mb-4">¿Confirmas que deseas completar este pago?</p>			<!-- Usar el componente PagoResumen modular -->
			<PagoResumen 
				pago={selectedPago} 
				historialPagos={$pagos} 
			/>

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
			</Button>			<Button variant="success" on:click={confirmCompletePago} isLoading={$isLoading}>
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
		canEdit={pagoUtils.isUltimoPago(selectedPago, $pagos)}
		{cuotasPendientesGlobales}
		onClose={() => {
			showDetailModal = false;
			selectedPago = null;
		}}
		onSuccess={handleDetailSuccess}
	/>
{/if}
