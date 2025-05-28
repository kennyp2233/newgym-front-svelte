<!-- src/routes/clientes/[id]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import DashboardLayout from '$lib/components/layouts/DashboardLayout.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import { clienteService, type Cliente, TipoOcupacion } from '../../../features/clientes/api';
	import { pagoService } from '../../../features/pagos/api';
	import { toasts } from '$lib/stores/toastStore';
	import EditarClienteModal from '../../../features/clientes/components/individual/info-personal/EditarClienteModal.svelte';
	import NuevoPagoModal from '../../../features/clientes/components/individual/pagos/NuevoPagoModal.svelte';
	import CompletarPagoModal from '../../../features/clientes/components/individual/pagos/CompletarPagoModal.svelte';
	import NuevaMedidaModal from '../../../features/clientes/components/individual/medidas/NuevaMedidaModal.svelte';
	import MedidasHistoricas from '../../../features/clientes/components/individual/medidas/MedidasHistoricas.svelte';
	import HistorialPagos from '../../../features/clientes/components/individual/pagos/HistorialPagos.svelte';

	// Estados reactivos
	let cliente: Cliente | null = null;
	let isLoading = false;
	let showEditModal = false;
	let showPagoModal = false;
	let showMedidaModal = false;
	let showDeleteModal = false;
	let showCompletarPagoModal = false;
	let tieneDeudaPendiente = false;
	let pagosPendientes: any[] = [];

	// Estados para manejo de tabs y modales
	let activeTab = 'medidas';

	// Key para forzar re-render de componentes
	let componentKey = 0;

	// Reactive statements
	$: clienteId = parseInt($page.params.id);
	$: esNino = cliente?.ocupacion === TipoOcupacion.NINO;

	// IMPORTANTE: Hacer que los tabs sean reactivos al cliente
	$: tabs = cliente
		? [
				{
					key: 'medidas',
					label: 'Medidas',
					component: MedidasHistoricas,
					leftIcon: 'dashboard',
					props: {
						clienteId,
						cliente,
						onUpdate: reloadClienteData,
						key: componentKey // Forzar re-render
					}
				},
				{
					key: 'pagos',
					label: 'Historial de Pagos',
					component: HistorialPagos,
					leftIcon: 'dashboard',
					props: {
						clienteId,
						cliente,
						onUpdate: reloadClienteData,
						key: componentKey // Forzar re-render
					}
				}
			]
		: [];

	onMount(async () => {
		// Verificar que tenemos un ID válido
		if (isNaN(clienteId)) {
			toasts.showToast('ID de cliente inválido', 'error');
			goto('/clientes');
			return;
		}

		await loadClienteData();
		await checkDeudaPendiente();
		await loadPagosPendientes();
	});

	// Cargar datos del cliente
	async function loadClienteData() {
		if (isNaN(clienteId)) return;

		isLoading = true;
		try {
			const clienteData = await clienteService.getClienteById(clienteId);
			if (clienteData) {
				cliente = clienteData;
			} else {
				toasts.showToast('Cliente no encontrado', 'error');
				goto('/clientes');
			}
		} catch (error) {
			console.error('Error al cargar cliente:', error);
			toasts.showToast('Error al cargar datos del cliente', 'error');
			goto('/clientes');
		} finally {
			isLoading = false;
		}
	}

	// Verificar si el cliente tiene deuda pendiente
	async function checkDeudaPendiente() {
		if (isNaN(clienteId)) return;

		try {
			const pagos = await pagoService.getPagosByCliente(clienteId);
			tieneDeudaPendiente = pagos.some((pago) => pago.estado === 'Pendiente');
		} catch (error) {
			console.error('Error al verificar deuda:', error);
		}
	}

	// Cargar pagos pendientes
	async function loadPagosPendientes() {
		try {
			const pagos = await pagoService.getPagosByCliente(clienteId);
			pagosPendientes = pagos.filter((p) => p.estado === 'Pendiente');
		} catch (error) {
			console.error('Error al cargar pagos pendientes:', error);
		}
	}

	// Función para recargar datos del cliente
	async function reloadClienteData() {
		if (isNaN(clienteId)) return;

		isLoading = true;
		try {
			const clienteActualizado = await clienteService.getClienteById(clienteId);
			if (clienteActualizado) {
				cliente = clienteActualizado;
				await checkDeudaPendiente();
				await loadPagosPendientes();
				// Incrementar key para forzar re-render de componentes hijos
				componentKey++;
			}
		} catch (error) {
			console.error('Error al recargar datos:', error);
			toasts.showToast('Error al recargar datos del cliente', 'error');
		} finally {
			isLoading = false;
		}
	}

	// Calcular edad
	function calcularEdad(fechaNacimiento?: string): number {
		if (!fechaNacimiento) return 0;
		const hoy = new Date();
		const fechaNac = new Date(fechaNacimiento);
		let edad = hoy.getFullYear() - fechaNac.getFullYear();
		const mes = hoy.getMonth() - fechaNac.getMonth();
		if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
			edad--;
		}
		return edad;
	}

	// Obtener información de membresía
	function getMembresia() {
		if (!cliente || !cliente.inscripciones || cliente.inscripciones.length === 0) {
			return 'Sin membresía';
		}

		const inscripcionActiva = [...cliente.inscripciones].sort(
			(a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
		)[0];

		if (!inscripcionActiva.fechaFin) return 'Sin fecha de fin';

		const fechaFin = new Date(inscripcionActiva.fechaFin);
		const hoy = new Date();
		const diffTime = fechaFin.getTime() - hoy.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		const planNombre = inscripcionActiva.plan?.nombre || 'Plan';
		return `${planNombre} (${diffDays > 0 ? diffDays : 0} días restantes)`;
	}

	// Formatear fecha
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Obtener plan actual ID
	function getPlanActualId(): number | undefined {
		if (!cliente?.inscripciones || cliente.inscripciones.length === 0) return undefined;
		const inscripcionActiva = [...cliente.inscripciones].sort(
			(a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
		)[0];
		return inscripcionActiva.idPlan;
	}

	// Handlers para modales
	function handleEditCliente() {
		showEditModal = true;
	}

	function handleNuevoPago() {
		showPagoModal = true;
	}

	function handleNuevaMedida() {
		showMedidaModal = true;
	}

	function handleDeleteCliente() {
		showDeleteModal = true;
	}

	function handleCompletarPago() {
		showCompletarPagoModal = true;
	}

	async function confirmDeleteCliente() {
		isLoading = true;
		try {
			const success = await clienteService.deleteCliente(clienteId);
			if (success) {
				toasts.showToast('Cliente eliminado correctamente', 'success');
				goto('/clientes');
			}
		} catch (error) {
			toasts.showToast('Error al eliminar cliente', 'error');
		} finally {
			isLoading = false;
			showDeleteModal = false;
		}
	}

	// Success handlers para modales
	function handleEditSuccess() {
		showEditModal = false;
		reloadClienteData();
	}

	function handlePagoSuccess() {
		showPagoModal = false;
		reloadClienteData();
	}

	function handleMedidaSuccess() {
		showMedidaModal = false;
		reloadClienteData();
	}

	function handleCompletarPagoSuccess() {
		showCompletarPagoModal = false;
		reloadClienteData();
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
				<h1 class="text-2xl font-bold text-[var(--letter)]">
					{isLoading ? 'Cargando...' : 'Ficha de cliente'}
				</h1>
			</div>
		</div>

		{#if isLoading}
			<div class="flex h-64 items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
				></div>
			</div>
		{:else if cliente}
			<!-- Panel de información personal -->
			<Panel title="Información personal" variant="clean" titleIcon="people">
				<svelte:fragment slot="header-actions">
					<div class="flex items-center gap-2">
						<Button variant="outline" size="sm" on:click={handleEditCliente}>
							<Icon name="edit" size={16} className="mr-2" />
							Editar información
						</Button>
						<Button variant="danger" size="sm" on:click={handleDeleteCliente}>
							<Icon name="trash" size={16} className="mr-2" />
							Eliminar
						</Button>
					</div>
				</svelte:fragment>

				<div class="rounded-lg bg-white p-6 shadow-sm">
					<!-- Header principal con nombre y cédula centrado -->
					<div class="mb-8 text-center">
						<h1 class="mb-2 text-2xl font-bold text-[var(--primary)]">
							{cliente.apellido}
							{cliente.nombre}
						</h1>
						<p class="text-lg font-medium text-gray-700">
							Cédula identidad No. {cliente.cedula}
						</p>
					</div>

					<!-- Grid de información en 3 columnas como en la imagen -->
					<div class="mx-auto grid max-w-4xl grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-3">
						<!-- Primera columna -->
						<div class="space-y-6">
							<div>
								<p class="mb-1 text-sm font-medium text-gray-700">
									<span class="font-bold">Edad:</span>
									{calcularEdad(cliente.fechaNacimiento)} años
								</p>
							</div>

							<div>
								<p class="mb-1 text-sm font-medium text-gray-700">
									<span class="font-bold">Correo electrónico:</span>
									{cliente.correo}
								</p>
							</div>
						</div>

						<!-- Segunda columna -->
						<div class="space-y-6">
							<div>
								<p class="mb-1 text-sm font-medium text-gray-700">
									<span class="font-bold">Membresía:</span>
									<span class={tieneDeudaPendiente ? 'font-medium text-red-600' : ''}>
										{getMembresia()}
										{#if tieneDeudaPendiente}
											⚠️ PAGO PENDIENTE{/if}
									</span>
								</p>
							</div>
						</div>

						<!-- Tercera columna -->
						<div class="space-y-6">
							<div>
								<p class="mb-1 text-sm font-medium text-gray-700">
									<span class="font-bold">Teléfono:</span>
									{cliente.celular}
								</p>
							</div>

							<div>
								<p class="mb-1 text-sm font-medium text-gray-700">
									<span class="font-bold">Ocupación:</span>
									{cliente.ocupacion}{#if cliente.puestoTrabajo}
										- {cliente.puestoTrabajo}{/if}
								</p>
							</div>
						</div>
					</div>

					{#if tieneDeudaPendiente}
						<div class="mx-auto mt-8 max-w-4xl rounded-md border border-red-200 bg-red-50 p-4">
							<p class="text-center font-medium text-red-700">
								⚠️ Este cliente tiene un pago pendiente. Complete el pago antes de realizar nuevas
								acciones.
							</p>
						</div>
					{/if}

					<!-- Información adicional colapsable o en sección separada si es necesaria -->
					{#if cliente.fechaNacimiento || cliente.direccion || cliente.ciudad}
						<details class="mx-auto mt-8 max-w-4xl">
							<summary
								class="mb-4 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800"
							>
								Ver información adicional
							</summary>

							<div class="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2">
								{#if cliente.fechaNacimiento}
									<div>
										<h3 class="text-sm font-medium text-gray-600">Fecha de nacimiento:</h3>
										<p class="text-gray-800">{formatDate(cliente.fechaNacimiento)}</p>
									</div>
								{/if}

								<div>
									<h3 class="text-sm font-medium text-gray-600">Dirección:</h3>
									<p class="text-gray-800">{cliente.direccion}</p>
								</div>

								<div>
									<h3 class="text-sm font-medium text-gray-600">Lugar de residencia:</h3>
									<p class="text-gray-800">{cliente.ciudad} - {cliente.pais}</p>
								</div>

								{#if cliente.inscripciones && cliente.inscripciones.length > 0}
									<div>
										<h3 class="text-sm font-medium text-gray-600">Fecha de inicio:</h3>
										<p class="text-gray-800">{formatDate(cliente.inscripciones[0].fechaInicio)}</p>
									</div>
									<div>
										<h3 class="text-sm font-medium text-gray-600">Fecha de fin:</h3>
										<p class="text-gray-800">
											{cliente.inscripciones[0].fechaFin
												? formatDate(cliente.inscripciones[0].fechaFin)
												: 'No definida'}
										</p>
									</div>
								{/if}
							</div>
						</details>
					{/if}
				</div>
			</Panel>

			<!-- Panel con tabs - Solo mostrar si hay tabs -->
			{#if tabs.length > 0}
				<Panel {tabs} defaultActiveTab="medidas" variant="clean" bind:activeTab>
					<svelte:fragment slot="header-actions" let:activeTab>
						{#if activeTab === 'medidas'}
							<Button variant="primary" size="sm" on:click={handleNuevaMedida}>
								<Icon name="plus" size={16} className="mr-2" />
								Nueva Medida
							</Button>
						{:else if activeTab === 'pagos'}
							{#if pagosPendientes.length > 0}
								<Button variant="success" size="sm" on:click={handleCompletarPago}>
									<Icon name="check" size={16} className="mr-2" />
									Completar Pago Pendiente
								</Button>
							{:else}
								<Button variant="primary" size="sm" on:click={handleNuevoPago}>
									<Icon name="plus" size={16} className="mr-2" />
									Renovar Plan
								</Button>
							{/if}
						{/if}
					</svelte:fragment>
				</Panel>
			{/if}
		{:else}
			<div class="flex h-64 items-center justify-center text-gray-500">Cliente no encontrado</div>
		{/if}

		<!-- Modales -->
		{#if showEditModal && cliente}
			<EditarClienteModal
				isOpen={showEditModal}
				{cliente}
				onClose={() => (showEditModal = false)}
				onSuccess={handleEditSuccess}
			/>
		{/if}

		{#if showPagoModal && cliente}
			<NuevoPagoModal
				isOpen={showPagoModal}
				{cliente}
				planActualId={getPlanActualId()}
				isRenovacion={!tieneDeudaPendiente}
				onClose={() => (showPagoModal = false)}
				onSuccess={handlePagoSuccess}
			/>
		{/if}

		{#if showCompletarPagoModal && cliente}
			<CompletarPagoModal
				isOpen={showCompletarPagoModal}
				{cliente}
				{pagosPendientes}
				onClose={() => (showCompletarPagoModal = false)}
				onSuccess={handleCompletarPagoSuccess}
			/>
		{/if}

		{#if showMedidaModal && cliente}
			<NuevaMedidaModal
				isOpen={showMedidaModal}
				{cliente}
				onClose={() => (showMedidaModal = false)}
				onSuccess={handleMedidaSuccess}
			/>
		{/if}

		<!-- Modal de confirmación para eliminar -->
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
					{cliente?.nombre}
					{cliente?.apellido}
				</p>
				<p class="mt-1 text-sm text-gray-500">Esta acción no se puede deshacer.</p>
			</div>

			<svelte:fragment slot="footer">
				<Button variant="outline" on:click={() => (showDeleteModal = false)}>Cancelar</Button>
				<Button variant="danger" on:click={confirmDeleteCliente} {isLoading}>Eliminar</Button>
			</svelte:fragment>
		</BaseModal>
	</div>
</DashboardLayout>
