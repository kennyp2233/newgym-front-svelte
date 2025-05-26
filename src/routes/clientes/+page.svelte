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
	import ClienteFormModal from '../../features/clientes/components/general/ClienteFormModal.svelte';
	import { clienteStore } from '../../features/clientes/stores/clienteStore';
	import { toasts } from '$lib/stores/toastStore';
	import { calcularDiasRestantes, formatDate } from '$lib/utils';
	import type { Cliente, RegistroCompletoDTO } from '../../features/clientes/api';
	import type { ClienteFormData } from '../../features/clientes/forms/validation';

	let searchTerm = '';
	let showDeleteModal = false;
	let showFormModal = false;
	let selectedCliente: Cliente | null = null;
	let clienteToEdit: Partial<ClienteFormData> | null = null;
	let isEditing = false;

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
		clienteToEdit = null;
		isEditing = false;
		showFormModal = true;
	}

	function handleViewDetails(cliente: Cliente) {
		goto(`/clientes/${cliente.idCliente}`);
	}

	function handleEditCliente(cliente: Cliente) {
		// Convertir datos del cliente al formato del formulario
		const inscripcionActual = cliente.inscripciones?.sort(
			(a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
		)[0];

		const ultimaMedida = cliente.medidas?.sort(
			(a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
		)[0];

		clienteToEdit = {
			cedula: cliente.cedula,
			nombre: cliente.nombre,
			apellido: cliente.apellido,
			celular: cliente.celular,
			ciudad: cliente.ciudad,
			pais: cliente.pais,
			direccion: cliente.direccion,
			fechaNacimiento: cliente.fechaNacimiento || '',
			correo: cliente.correo,
			ocupacion: cliente.ocupacion,
			puestoTrabajo: cliente.puestoTrabajo || '',
			idPlan: inscripcionActual?.idPlan?.toString() || '',
			fechaInicio: inscripcionActual?.fechaInicio || new Date().toISOString().split('T')[0],
			peso: ultimaMedida?.peso || 0,
			altura: ultimaMedida?.altura || 0,
			brazos: ultimaMedida?.brazos || 0,
			pantorrillas: ultimaMedida?.pantorrillas || 0,
			gluteo: ultimaMedida?.gluteo || 0,
			muslos: ultimaMedida?.muslos || 0,
			pecho: ultimaMedida?.pecho || 0,
			cintura: ultimaMedida?.cintura || 0,
			cuello: ultimaMedida?.cuello || 0
		};

		isEditing = true;
		showFormModal = true;
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

	async function handleClienteSubmit(registroData: RegistroCompletoDTO) {
		try {
			if (isEditing && selectedCliente) {
				// Actualizar cliente existente - esto necesitaría implementarse en el store
				// Por ahora simulo el comportamiento
				toasts.showToast('Cliente actualizado correctamente', 'success');
			} else {
				// Crear nuevo cliente
				await clienteStore.addCliente(registroData);
				toasts.showToast('Cliente registrado correctamente', 'success');
			}
			showFormModal = false;
		} catch (error) {
			// El error ya se maneja en el modal
			throw error;
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
					<Input placeholder="Buscar cliente" bind:value={searchTerm} leftIcon="search" />
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

	<!-- Modal del formulario de cliente -->
	<ClienteFormModal
		isOpen={showFormModal}
		onClose={() => {
			showFormModal = false;
			clienteToEdit = null;
			isEditing = false;
		}}
		onSubmit={handleClienteSubmit}
		{clienteToEdit}
	/>

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
