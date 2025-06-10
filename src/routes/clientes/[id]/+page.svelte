<!-- src/routes/clientes/[id]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import DashboardLayout from '$lib/components/layouts/DashboardLayout.svelte';
	import TabContainer from '../../../lib/components/ui/TabContainer.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { toasts } from '$lib/stores/toastStore';

	// Feature components
	import ClienteDetailHeader from '../../../features/clientes/components/ClienteDetailHeader.svelte';
	import ClienteModalManager from '../../../features/clientes/components/ClienteModalManager.svelte';
	import MedidasHistoricas from '../../../features/clientes/components/individual/medidas/MedidasHistoricas.svelte';
	import HistorialPagos from '../../../features/clientes/components/individual/pagos/HistorialPagos.svelte';

	// Composables
	import { useClienteDetailPage } from '../../../features/clientes/composables/useClienteDetailPage';

	// Initialize page state
	$: clienteId = parseInt($page.params.id);
	$: pageManager = useClienteDetailPage(clienteId);

	// Destructure for easier access
	$: ({
		cliente,
		isLoading,
		error,
		esActivo,
		diasRestantes,
		pageState,
		tabs,
		loadInitialData,
		reloadClienteData,
		modalActions
	} = pageManager);
	// Current page state
	$: ({
		showEditModal,
		showPagoModal,
		showMedidaModal,
		showDeleteModal,
		showCompletarPagoModal,
		tieneDeudaPendiente,
		tieneCuotasPendientes,
		activeTab,
		preselectedPago
	} = $pageState);
	// Tab component configurations
	const tabComponents = {
		medidas: MedidasHistoricas,
		pagos: HistorialPagos
	};

	// Lifecycle
	onMount(async () => {
		const success = await loadInitialData();
		if (!success) {
			goto('/clientes');
		}
	});
	// Event handlers
	function handleModalClose(event: CustomEvent) {
		const { modal } = event.detail;
		const closeFunction =
			modalActions[
				`close${modal.charAt(0).toUpperCase() + modal.slice(1)}Modal` as keyof typeof modalActions
			];
		if (typeof closeFunction === 'function') {
			closeFunction();
		}
	}

	function handleModalConfirm(event: CustomEvent) {
		const { action } = event.detail;
		if (action === 'delete') {
			confirmDeleteCliente();
		}
	}
	async function confirmDeleteCliente() {
		try {
			await pageManager.eliminarCliente();
			toasts.showToast('Cliente eliminado correctamente', 'success');
			goto('/clientes');
		} catch (error) {
			toasts.showToast('Error al eliminar cliente', 'error');
		} finally {
			modalActions.closeDeleteModal();
		}
	}

	function handleTabChange(event: CustomEvent) {
		const { tab } = event.detail;
		pageState.update((state) => ({ ...state, activeTab: tab }));
	}
</script>

<DashboardLayout>
	<div class="space-y-6">
		<!-- Header con botón volver -->
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-2">
				<Button variant="outline" size="sm" on:click={() => goto('/clientes')}>
					<Icon name="arrow-left" size={16} className="mr-2" />
					Volver
				</Button>
			</div>
		</div>

		{#if $isLoading}
			<div class="flex h-64 items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
				></div>
			</div>
		{:else if $cliente}
			<!-- Client Header -->
			<ClienteDetailHeader
				cliente={$cliente}
				{tieneDeudaPendiente}
				{tieneCuotasPendientes}
				cuotasPendientes={$pageState.cuotasPendientes}
				historialPagos={$pageState.historialPagos}
				on:edit={modalActions.openEditModal}
				on:renovarMembresia={modalActions.openPagoModal}
				on:completarPago={modalActions.openCompletarPagoModal}
				on:delete={modalActions.openDeleteModal}
			/>
			<!-- Tabs Container -->
			<TabContainer
				tabs={$tabs}
				{activeTab}
				components={tabComponents}
				on:tabChange={handleTabChange}
				on:update={reloadClienteData}
			>
				<div slot="tab-actions" let:activeTab>
					{#if activeTab === 'medidas'}
						<Button variant="primary" size="sm" on:click={modalActions.openMedidaModal}>
							<Icon name="plus" size={16} className="mr-2" />
							Nueva Medida
						</Button>
					{/if}
				</div>
			</TabContainer>
		{:else}
			<div class="flex h-64 items-center justify-center text-gray-500">Cliente no encontrado</div>
		{/if}

		<!-- Modal Manager -->
		<ClienteModalManager
			cliente={$cliente}
			{showEditModal}
			{showPagoModal}
			{showMedidaModal}
			{showDeleteModal}
			{showCompletarPagoModal}
			{preselectedPago}
			on:update={reloadClienteData}
			on:close={handleModalClose}
			on:confirm={handleModalConfirm}
		/>
	</div>
</DashboardLayout>
