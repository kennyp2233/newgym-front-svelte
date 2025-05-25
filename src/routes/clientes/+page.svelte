<!-- src/routes/clientes/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import DashboardLayout from '$lib/components/layouts/DashboardLayout.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import { clienteStore } from '../../features/clientes/stores/clienteStore';
	import { toasts } from '$lib/stores/toastStore';
	import { calcularDiasRestantes, formatDate } from '$lib/utils';
	import type { Cliente } from '../../features/clientes/api';

	let searchTerm = '';
	let showDeleteModal = false;
	let selectedCliente: Cliente | null = null;

	// Reactive statement para filtrar clientes
	$: filteredClientes = $clienteStore.clientes.filter(
		(cliente) =>
			`${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cliente.cedula.includes(searchTerm) ||
			cliente.celular.includes(searchTerm)
	);

	// Determinar el estado de la membresía
	function determinarEstado(cliente: Cliente) {
		if (!cliente.inscripciones || cliente.inscripciones.length === 0) {
			return 'Sin membresía';
		}

		const inscripcionActiva = cliente.inscripciones.sort(
			(a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
		)[0];

		if (!inscripcionActiva?.fechaFin) return 'Sin membresía';

		const diasRestantes = calcularDiasRestantes(inscripcionActiva.fechaFin);

		if (diasRestantes === 0) return 'Expirada';
		else if (diasRestantes <= 7) return 'Renovar';
		else return 'En curso';
	}

	// Configuración de columnas para la tabla
	const columns = [
		{
			key: 'nombre',
			header: 'Nombres',
			width: '22%',
			render: (_: string, cliente: Cliente) => `${cliente.nombre} ${cliente.apellido}`
		},
		{
			key: 'cedula',
			header: 'Cédula',
			width: '12%'
		},
		{
			key: 'celular',
			header: 'Contacto',
			width: '12%'
		},
		{
			key: 'plan',
			header: 'Plan',
			width: '20%',
			render: (_: string, cliente: Cliente) => {
				if (!cliente.inscripciones || cliente.inscripciones.length === 0) {
					return 'Sin plan';
				}
				const inscripcionActiva = cliente.inscripciones.sort(
					(a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
				)[0];

				return inscripcionActiva?.plan?.nombre ?? 'Sin plan activo';
			}
		},
		{
			key: 'diasRestantes',
			header: 'Días restantes',
			width: '12%',
			render: (_: string, cliente: Cliente) => {
				if (!cliente.inscripciones || cliente.inscripciones.length === 0) return '0 días';

				const inscripcionActiva = cliente.inscripciones.sort(
					(a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
				)[0];

				if (!inscripcionActiva?.fechaFin) return '0 días';

				const dias = calcularDiasRestantes(inscripcionActiva.fechaFin);
				return dias === 1 ? `${dias} día` : `${dias} días`;
			}
		},
		{
			key: 'estado',
			header: 'Estado',
			width: '12%',
			render: (_: string, cliente: Cliente) => {
				const estado = determinarEstado(cliente);
				let className = '';

				switch (estado) {
					case 'En curso':
						className = 'bg-green-100 text-green-800';
						break;
					case 'Renovar':
						className = 'bg-yellow-100 text-yellow-800';
						break;
					case 'Expirada':
					case 'Sin membresía':
						className = 'bg-red-100 text-red-800';
						break;
					default:
						className = 'bg-gray-100 text-gray-800';
				}

				return `<span class="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${className}">${estado}</span>`;
			}
		}
	];

	function handleAddCliente() {
		// TODO: Implementar modal de agregar cliente
		toasts.showToast('Funcionalidad en desarrollo', 'info');
	}

	function handleViewDetails(cliente: Cliente) {
		goto(`/clientes/${cliente.idCliente}`);
	}

	function handleEditCliente(cliente: Cliente) {
		// TODO: Implementar modal de editar cliente
		toasts.showToast('Funcionalidad en desarrollo', 'info');
	}

	function handleDeleteCliente(cliente: Cliente) {
		selectedCliente = cliente;
		showDeleteModal = true;
	}

	async function confirmDeleteCliente() {
		if (!selectedCliente) return;

		try {
			await clienteStore.deleteCliente(selectedCliente.idCliente);
			toasts.showToast('Cliente eliminado correctamente', 'success');
		} catch (error) {
			toasts.showToast('Error al eliminar el cliente', 'error');
		} finally {
			showDeleteModal = false;
			selectedCliente = null;
		}
	}

	onMount(() => {
		clienteStore.loadClientes();
	});
</script>

<DashboardLayout>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold text-[var(--letter)]">Clientes</h1>
		</div>

		<div class="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
			<div class="mb-6 flex justify-between">
				<div class="w-64">
					<Input
						placeholder="Buscar cliente"
						bind:value={searchTerm}
						leftIcon="<svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z'></path></svg>"
					/>
				</div>
				<Button variant="primary" on:click={handleAddCliente}>
					<Icon name="add" size={16} className="mr-2" />
					Agregar Cliente
				</Button>
			</div>

			<Table
				data={filteredClientes}
				{columns}
				keyExtractor={(item) => item.idCliente.toString()}
				onRowClick={handleViewDetails}
				isLoading={$clienteStore.loading}
				emptyStateMessage="No se encontraron clientes que coincidan con la búsqueda"
				rowClassName={() => 'bg-[var(--sections)] hover:bg-[var(--sections-hover)] cursor-pointer'}
				className="rounded-lg overflow-hidden"
			/>
		</div>
	</div>

	<!-- Modal de confirmación para eliminar cliente -->
	<BaseModal
		isOpen={showDeleteModal}
		onClose={() => (showDeleteModal = false)}
		size="sm"
		closeOnClickOutside
	>
		<svelte:fragment slot="header">
			<h3 class="text-lg font-semibold">Confirmar eliminación</h3>
		</svelte:fragment>

		<div class="p-4 text-center">
			<p>¿Estás seguro que deseas eliminar este cliente?</p>
			<p class="mt-2 font-bold">
				{selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellido}` : ''}
			</p>
			<p class="mt-1 text-sm text-gray-500">Esta acción no se puede deshacer.</p>
		</div>

		<svelte:fragment slot="footer">
			<Button variant="outline" on:click={() => (showDeleteModal = false)}>Cancelar</Button>
			<Button variant="danger" on:click={confirmDeleteCliente} isLoading={$clienteStore.loading}>
				Eliminar
			</Button>
		</svelte:fragment>
	</BaseModal>
</DashboardLayout>
