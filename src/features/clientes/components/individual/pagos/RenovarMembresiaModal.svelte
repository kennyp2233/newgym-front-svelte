<!-- src/features/clientes/components/individual/pagos/RenovarMembresiaModal.svelte -->
<!-- Modal específico para renovación de membresías -->
<script lang="ts">
	import { onMount } from 'svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { toasts } from '$lib/stores/toastStore';
	import type { Cliente } from '../../../api';

	// Importar composables específicos para renovación
	import {
		createPagoStore,
		createRenovacionValidator
	} from '../../../../pagos/composables/pagoComposables';
	import { createRenovacionManager } from '../../../../pagos/composables/renovacionComposables';
	import { useRenovacionForm } from '../../../../pagos/composables/useRenovacionForm';

	// Importar componentes modulares
	import PagoFormFields from '../../../../pagos/forms/PagoFormFields.svelte';
	import RenovacionStatusAlerts from './components/RenovacionStatusAlerts.svelte';
	import RenovacionResumen from './components/RenovacionResumen.svelte';
	export let isOpen = false;
	export let cliente: Cliente;
	export let planActualId: number | undefined = undefined;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	// Composables para lógica de negocio
	const pagoStore = createPagoStore(cliente.idCliente);
	const renovacionValidator = createRenovacionValidator(cliente);
	const renovacionManager = createRenovacionManager(cliente, planActualId);
	const formManager = useRenovacionForm(cliente, planActualId);

	// Destructurar stores para acceso reactivo
	const { tieneDeudaActiva: pagoStoreState } = pagoStore;
	const { puedeRenovar: renovacionState } = renovacionValidator;
	const {
		planes,
		planSeleccionado,
		cuotasPendientes,
		precioTotal,
		montoMinimo,
		getTotalCuotasPendientes
	} = renovacionManager;
	const { form, errors, touched, validateForm, updateFieldWrapper, caracteresRestantes } =
		formManager;

	let isSubmitting = false; // Función de submit para renovación de membresía
	async function handleSubmitForm() {
		const isValid = await validateForm($cuotasPendientes, $planes);
		if (!isValid) {
			toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
			return;
		}

		// Verificar deuda activa usando composable
		if ($pagoStoreState) {
			toasts.showToast(
				'No se puede renovar la membresía mientras haya deuda pendiente. Complete el pago anterior primero.',
				'error'
			);
			return;
		}

		// Verificar renovación usando composable
		if (!$renovacionState.puede) {
			toasts.showToast($renovacionState.mensaje, 'error');
			return;
		}

		isSubmitting = true;
		const montoFinal = $form.monto ? parseFloat($form.monto.toString()) : $precioTotal;

		// Determinar si hay cuotas pendientes y cuáles pagar
		const tieneCuotasPendientes = $cuotasPendientes.length > 0;
		const cuotasPorPagar = tieneCuotasPendientes
			? $cuotasPendientes.map((c) => c.idCuota || c.anio)
			: undefined;

		const exito = await pagoStore.crearPago({
			idCliente: cliente.idCliente,
			idPlan: parseInt($form.idPlan),
			monto: montoFinal,
			fechaInicio: $form.fechaInicio || undefined,
			referencia: $form.referencia || undefined,
			observaciones: $form.observaciones || undefined,
			// Configuración para cuotas de mantenimiento
			pagaCuotasPendientes: tieneCuotasPendientes,
			cuotasPorPagar: cuotasPorPagar
		});
		if (exito) {
			toasts.showToast('Membresía renovada exitosamente', 'success');
			onSuccess();
			onClose(); // Cerrar el modal después del éxito
		}
		isSubmitting = false;
	} // Cargar datos iniciales
	onMount(async () => {
		try {
			// Cargar datos usando el manager de renovación
			await renovacionManager.cargarDatos();

			// Cargar datos usando composables
			await pagoStore.cargarPagos();
			await pagoStore.verificarDeudaActiva();
			await renovacionValidator.validarRenovacion();

			// Establecer monto inicial si hay un plan seleccionado
			if (planActualId && $precioTotal > 0) {
				setTimeout(() => {
					updateFieldWrapper('monto', $precioTotal.toString());
				}, 0);
			}
		} catch (error) {
			console.error('Error al cargar datos:', error);
			toasts.showToast('Error al cargar información', 'error');
		}
	});

	// Actualizar plan seleccionado cuando cambia el idPlan
	function handlePlanChange(idPlan: string) {
		renovacionManager.seleccionarPlan(idPlan);

		// Automáticamente establecer el monto total al seleccionar un plan
		if ($precioTotal > 0) {
			updateFieldWrapper('monto', $precioTotal.toString());
		}
	}

	// Reactivos para mantener sincronización
	$: if ($form.idPlan) {
		handlePlanChange($form.idPlan);
	}

	$: if ($precioTotal > 0 && !$form.monto) {
		updateFieldWrapper('monto', $precioTotal.toString());
	}
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">Renovar Membresía</h3>
	</svelte:fragment>
	<!-- Componente de alertas de estado -->
	<RenovacionStatusAlerts
		pagoStoreState={$pagoStoreState}
		renovacionState={$renovacionState}
		cuotasPendientes={$cuotasPendientes}
	/>

	<!-- Formulario de renovación -->
	{#if !$pagoStoreState && $renovacionState.puede}
		<form on:submit|preventDefault={handleSubmitForm}>
			<div class="space-y-4">
				<p class="mb-4 text-sm text-gray-600">
					Renovar membresía para <strong>{cliente.nombre} {cliente.apellido}</strong>
				</p>

				<!-- Componente de formulario modular -->
				<div class="space-y-4 rounded-md border border-[var(--border)] bg-[var(--sections)] p-4">
					<h3 class="text-lg font-semibold text-[var(--letter)]">Detalles de la renovación</h3>
					<PagoFormFields
						bind:form={$form}
						planes={$planes}
						planSeleccionado={$planSeleccionado}
						precioTotal={$precioTotal}
						caracteresRestantes={$caracteresRestantes}
						errors={$errors}
						touched={$touched}
						isRenovacion={true}
						cuotasPendientes={$cuotasPendientes}
						helperTextMonto={`Monto total requerido: $${$precioTotal.toFixed(2)} (Plan: $${$planSeleccionado?.precio.toFixed(2) || '0.00'}${$cuotasPendientes.length > 0 ? ` + Cuotas pendientes: $${getTotalCuotasPendientes($cuotasPendientes).toFixed(2)}` : ''}). Mínimo: $${$montoMinimo.toFixed(2)}`}
					/>
				</div>
				<!-- Componente de resumen -->
				<RenovacionResumen
					planSeleccionado={$planSeleccionado}
					cuotasPendientes={$cuotasPendientes}
					precioTotal={$precioTotal}
					form={$form}
				/>
			</div>
		</form>
	{/if}<svelte:fragment slot="footer">
		{#if $pagoStoreState || !$renovacionState.puede}
			<Button variant="primary" on:click={onClose}>Entendido</Button>
		{:else}
			<Button variant="outline" on:click={onClose} type="button">Cancelar</Button>
			<Button variant="primary" on:click={handleSubmitForm} type="button" isLoading={isSubmitting}>
				Renovar Membresía
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
