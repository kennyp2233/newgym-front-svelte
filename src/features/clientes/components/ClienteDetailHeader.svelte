<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import type { Cliente } from '../types';
	
	export let cliente: Cliente;
	export let tieneDeudaPendiente: boolean = false;
	export let tieneCuotasPendientes: boolean = false;
	export let cuotasPendientes: any[] = [];

	const dispatch = createEventDispatcher<{
		edit: void;
		renovarMembresia: void;
		completarPago: void;
		delete: void;
	}>();
	// Utility functions
	function calcularEdad(fechaNacimiento: string | undefined): number {
		if (!fechaNacimiento) return 0;
		const hoy = new Date();
		const nacimiento = new Date(fechaNacimiento);
		let edad = hoy.getFullYear() - nacimiento.getFullYear();
		const mesActual = hoy.getMonth();
		const mesNacimiento = nacimiento.getMonth();
		
		if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
			edad--;
		}
		return edad;
	}

	function formatDate(dateString: string): string {
		if (!dateString) return 'No disponible';
		return new Date(dateString).toLocaleDateString('es-ES');
	}

	function getMembresia(): string {
		if (!cliente?.inscripciones || cliente.inscripciones.length === 0) {
			return 'Sin plan activo';
		}
		return cliente.inscripciones[0]?.plan?.nombre || 'Sin plan';
	}
</script>

<!-- Panel de información personal -->
<Panel title="Información personal" variant="clean" titleIcon="people">
	<svelte:fragment slot="header-actions">
		<div class="flex items-center gap-2">
			<!-- Botones de pago según el estado del cliente -->
			{#if tieneDeudaPendiente}
				<Button variant="success" size="sm" on:click={() => dispatch('completarPago')}>
					<Icon name="check" size={16} className="mr-2" />
					Completar Pago Pendiente
				</Button>
			{:else}
				<Button
					variant="primary"
					size="sm"
					disabled={tieneDeudaPendiente}
					on:click={() => dispatch('renovarMembresia')}
				>
					<Icon name="plus" size={16} className="mr-2" />
					Renovar Membresía
				</Button>
			{/if}

			<!-- Separador visual -->
			<div class="h-6 w-px bg-gray-300"></div>

			<!-- Botones de gestión del cliente -->
			<Button variant="outline" size="sm" on:click={() => dispatch('edit')}>
				<Icon name="edit" size={16} className="mr-2" />
				Editar información
			</Button>
			<Button variant="danger" size="sm" on:click={() => dispatch('delete')}>
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
						</span>
					</p>
					{#if tieneDeudaPendiente}
						<p class="text-sm font-medium text-red-600">⚠️ PAGO DE PLAN PENDIENTE</p>
					{:else if tieneCuotasPendientes}
						<p class="text-sm font-medium text-orange-600">
							⚠️ {cuotasPendientes.length} cuota{cuotasPendientes.length > 1 ? 's' : ''} de mantenimiento
							pendiente{cuotasPendientes.length > 1 ? 's' : ''}
						</p>
					{/if}
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
					⚠️ Este cliente tiene un pago de plan pendiente. Complete el pago antes de realizar
					nuevas acciones.
				</p>
			</div>
		{:else if tieneCuotasPendientes}
			<div
				class="mx-auto mt-8 max-w-4xl rounded-md border border-orange-200 bg-orange-50 p-4"
			>
				<p class="text-center font-medium text-orange-700">
					ℹ️ Este cliente tiene {cuotasPendientes.length} cuota{cuotasPendientes.length > 1
						? 's'
						: ''} de mantenimiento pendiente{cuotasPendientes.length > 1 ? 's' : ''}. Pueden
					incluirse en la próxima renovación de plan.
				</p>
			</div>
		{/if}

		<!-- Información adicional colapsable -->
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
