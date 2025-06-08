<script lang="ts">
	import { createEventDispatcher } from 'svelte';	import EditarClienteModal from './individual/info-personal/EditarClienteModal.svelte';
	import RenovarMembresiaModal from './individual/pagos/RenovarMembresiaModal.svelte';
	import CompletarPagoModal from './individual/pagos/CompletarPagoModal.svelte';
	import NuevaMedidaModal from './individual/medidas/NuevaMedidaModal.svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import type { Cliente } from '../types';

	export let cliente: Cliente | null = null;
	export let showEditModal: boolean = false;
	export let showPagoModal: boolean = false;
	export let showMedidaModal: boolean = false;
	export let showDeleteModal: boolean = false;
	export let showCompletarPagoModal: boolean = false;
	export let preselectedPago: any = null;

	const dispatch = createEventDispatcher<{
		update: void;
		close: { modal: string };
		confirm: { action: string };
	}>();

	function handleModalClose(modalName: string) {
		dispatch('close', { modal: modalName });
	}

	function handleUpdate() {
		dispatch('update');
	}

	function handleDeleteConfirm() {
		dispatch('confirm', { action: 'delete' });
	}
</script>

<!-- Edit Client Modal -->
{#if showEditModal && cliente}
	<EditarClienteModal
		isOpen={showEditModal}
		{cliente}
		onSuccess={handleUpdate}
		onClose={() => handleModalClose('edit')}
	/>
{/if}

<!-- Renovar Membresía Modal -->
{#if showPagoModal && cliente}
	<RenovarMembresiaModal
		isOpen={showPagoModal}
		{cliente}
		onSuccess={handleUpdate}
		onClose={() => handleModalClose('pago')}
	/>
{/if}

<!-- Completar Pago Modal -->
{#if showCompletarPagoModal && cliente}
	<CompletarPagoModal
		isOpen={showCompletarPagoModal}
		{cliente}
		{preselectedPago}
		onSuccess={handleUpdate}
		onClose={() => handleModalClose('completarPago')}
	/>
{/if}

<!-- Nueva Medida Modal -->
{#if showMedidaModal && cliente}
	<NuevaMedidaModal
		isOpen={showMedidaModal}
		{cliente}
		onSuccess={handleUpdate}
		onClose={() => handleModalClose('medida')}
	/>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && cliente}
	<BaseModal 
		isOpen={showDeleteModal}
		on:close={() => handleModalClose('delete')}
	>
		<div class="p-6">
			<div class="flex items-center mb-4">
				<div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
					<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-medium text-gray-900">
						¿Estás seguro que deseas eliminar este cliente?
					</h3>
					<p class="mt-1 text-sm text-gray-500">
						Esta acción no se puede deshacer. Se eliminará permanentemente la información del cliente 
						<strong>{cliente.nombre} {cliente.apellido}</strong>.
					</p>
				</div>
			</div>
			
			<div class="flex justify-end space-x-3">
				<button
					type="button"
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					on:click={() => handleModalClose('delete')}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
					on:click={handleDeleteConfirm}
				>
					Eliminar Cliente
				</button>
			</div>
		</div>
	</BaseModal>
{/if}
