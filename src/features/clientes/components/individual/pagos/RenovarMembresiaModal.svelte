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
	const { puedeRenovar: renovacionState } = renovacionValidator;	const {
		planes,
		planSeleccionado,
		cuotasPendientes,
		precioTotal,  // Solo precio del plan
		montoTotal,   // Plan + cuotas (total real)
		montoMinimo,
		getTotalCuotasPendientes
	} = renovacionManager;
	const { form, errors, touched, validateForm, updateFieldWrapper, caracteresRestantes } =
		formManager;
	let isSubmitting = false; 	// Submit form - simplified payment processing
	async function handleSubmitForm() {
		if (!await validateForm($cuotasPendientes, $planes)) {
			toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
			return;
		}

		if (resumenPago?.error) {
			toasts.showToast(resumenPago.mensaje, 'error');
			return;
		}

		if ($pagoStoreState) {
			toasts.showToast('Complete el pago pendiente antes de renovar.', 'error');
			return;
		}

		if (!$renovacionState.puede) {
			toasts.showToast($renovacionState.mensaje, 'error');
			return;
		}

		if (!resumenPago) {
			toasts.showToast('Error en el cálculo del pago.', 'error');
			return;
		}
		isSubmitting = true;
		
		// Preparar datos según documentación estricta
		const cuotasTotal = $cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
		const montoPlan = parseFloat($form.monto) || 0;
				const exito = await pagoStore.crearPago({
			idCliente: cliente.idCliente,
			idPlan: parseInt($form.idPlan),
			monto: montoPlan, // Solo el monto del plan
			montoCuotaMantenimiento: cuotasTotal, // Cuotas pendientes
			fechaInicio: $form.fechaInicio || undefined,
			referencia: $form.referencia || undefined,
			observaciones: $form.observaciones || undefined
		});
		
		if (exito) {
			onSuccess();
			onClose();
		}
		
		isSubmitting = false;
	}// Cargar datos iniciales
	onMount(async () => {
		try {
			// Cargar datos usando el manager de renovación
			await renovacionManager.cargarDatos();

			// Cargar datos usando composables
			await pagoStore.cargarPagos();
			await pagoStore.verificarDeudaActiva();
			await renovacionValidator.validarRenovacion();			// Establecer monto inicial si hay un plan seleccionado
			if (planActualId && $precioTotal > 0) {
				setTimeout(() => {
					updateFieldWrapper('monto', $precioTotal.toString());
				}, 0);
			}
		} catch (error) {
			console.error('Error al cargar datos:', error);
			toasts.showToast('Error al cargar información', 'error');
		}
	});	// Actualizar plan seleccionado cuando cambia el idPlan
	function handlePlanChange(idPlan: string) {
		renovacionManager.seleccionarPlan(idPlan);

		// Solo establecer el monto del plan si el campo está vacío
		if ($precioTotal > 0 && (!$form.monto || $form.monto === '')) {
			updateFieldWrapper('monto', $precioTotal.toString());
		}
	}
	// Reactivos para mantener sincronización
	$: if ($form.idPlan) {
		handlePlanChange($form.idPlan);
	}
	
	// Solo establecer monto inicial si no hay monto y hay precio del plan
	$: if ($precioTotal > 0 && !$form.monto) {
		updateFieldWrapper('monto', $precioTotal.toString());
	}	// Calcular resumen de pago según documentación estricta
	$: resumenPago = (() => {
		if (!$form.monto || !$planSeleccionado) return null;
		
		const montoPlan = parseFloat($form.monto.toString()) || 0;
		if (montoPlan <= 0) return null;
		
		const precioPlan = $planSeleccionado.precio;
		const cuotasTotal = $cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
		
		// Validar que el monto no exceda el precio del plan
		if (montoPlan > precioPlan) {
			return {
				error: true,
				mensaje: `El monto no puede exceder el precio del plan ($${precioPlan.toFixed(2)})`,
				montoMontoPlan: montoPlan
			};
		}
		
		// El resumen según la documentación:
		// - montoAlPlan = lo que va al plan (input del usuario)
		// - montoACuotas = cuotas pendientes (obligatorias, fijas)
		// - montoTotal = monto plan + cuotas pendientes
		const montoAlPlan = montoPlan;
		const montoACuotas = cuotasTotal;
		const montoTotal = montoAlPlan + montoACuotas;
		
		return {
			montoAlPlan,
			montoACuotas,
			montoTotal,
			esPagoParcial: montoAlPlan < precioPlan
		};
	})();
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
	/>	<!-- Formulario de renovación -->
	{#if !$pagoStoreState && $renovacionState.puede}
		<div class="space-y-6">
			<!-- Header del formulario -->
			<div class="border-b border-[var(--border)] pb-4">
				<h3 class="text-lg font-semibold text-[var(--letter)]">
					Renovar membresía - {cliente.nombre} {cliente.apellido}
				</h3>
			</div>

			<!-- Formulario -->
			<form on:submit|preventDefault={handleSubmitForm} class="space-y-6">
				<!-- Campos del formulario -->
				<div class="bg-[var(--sections)] rounded-lg border border-[var(--border)] p-6">
					<PagoFormFields
						bind:form={$form}
						planes={$planes}
						planSeleccionado={$planSeleccionado}
						caracteresRestantes={$caracteresRestantes}
						errors={$errors}
						touched={$touched}
						cuotasPendientes={$cuotasPendientes}
					/>
				</div>

				<!-- Resumen del pago -->
				{#if resumenPago && $form.monto && parseFloat($form.monto.toString()) > 0}
					{#if resumenPago.error}
						<div class="bg-red-50 border border-red-200 rounded-lg p-4">
							<div class="flex items-center gap-2">
								<span class="text-red-500 text-lg">⚠️</span>
								<p class="font-medium text-red-800">{resumenPago.mensaje}</p>
							</div>
						</div>
					{:else}
						<div class="bg-green-50 border border-green-200 rounded-lg p-6">
							<div class="flex justify-between items-center">
								<div>
									<h4 class="text-lg font-semibold text-green-800 mb-1">Total a pagar</h4>
									{#if resumenPago.esPagoParcial && $planSeleccionado}
									<p class="text-sm text-amber-600">
										Pago parcial • Restante: ${($planSeleccionado.precio - (resumenPago.montoAlPlan || 0)).toFixed(2)}
									</p>
									{/if}
								</div>
								<div class="text-right">
									<span class="text-3xl font-bold text-green-700">
										${(resumenPago.montoTotal || 0).toFixed(2)}
									</span>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			</form>
		</div>
	{/if}	<svelte:fragment slot="footer">
		{#if $pagoStoreState || !$renovacionState.puede}
			<Button variant="primary" on:click={onClose}>Entendido</Button>
		{:else}
			<Button variant="outline" on:click={onClose} type="button">Cancelar</Button>
			<Button 
				variant="primary" 
				on:click={handleSubmitForm} 
				type="button" 
				isLoading={isSubmitting}
				disabled={resumenPago?.error === true}
			>
				Renovar Membresía
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
