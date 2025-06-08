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
		
		const exito = await pagoStore.crearPago({
			idCliente: cliente.idCliente,
			idPlan: parseInt($form.idPlan),
			monto: resumenPago.montoAlPlan || 0,
			montoCuotaMantenimiento: resumenPago.montoACuotas || 0,
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

		// Solo establecer el monto total si el campo está vacío o es la primera vez
		if ($precioTotal > 0 && (!$form.monto || $form.monto === '')) {
			updateFieldWrapper('monto', $precioTotal.toString());
		}
	}
	// Reactivos para mantener sincronización
	$: if ($form.idPlan) {
		handlePlanChange($form.idPlan);
	}
	
	// Solo establecer monto inicial si no hay monto y hay precio total
	$: if ($precioTotal > 0 && !$form.monto) {
		updateFieldWrapper('monto', $precioTotal.toString());
	}	// Calculate payment breakdown
	$: resumenPago = (() => {
		if (!$form.monto || !$planSeleccionado) return null;
		
		const montoUsuario = parseFloat($form.monto.toString()) || 0;
		if (montoUsuario <= 0) return null;
		
		const precioPlan = $planSeleccionado.precio;
		const cuotasTotal = $cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
		
		if (cuotasTotal > 0 && montoUsuario < cuotasTotal) {
			return {
				error: true,
				mensaje: `Monto insuficiente. Las cuotas ($${cuotasTotal.toFixed(2)}) son obligatorias.`,
				montoMinimoRequerido: cuotasTotal
			};
		}
		
		const montoACuotas = cuotasTotal;
		const montoAlPlan = Math.min(montoUsuario - cuotasTotal, precioPlan);
		
		return {
			montoAlPlan,
			montoACuotas,
			montoTotal: montoAlPlan + montoACuotas,
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
						isRenovacion={true}						cuotasPendientes={$cuotasPendientes}
						helperTextMonto={$cuotasPendientes.length > 0 
							? `Plan: $${$planSeleccionado?.precio.toFixed(2) || '0.00'} + Cuotas: $${getTotalCuotasPendientes($cuotasPendientes).toFixed(2)} = Total: $${$precioTotal.toFixed(2)}` 
							: `Plan: $${$planSeleccionado?.precio.toFixed(2) || '0.00'} (pagos parciales permitidos)`}					/>
				</div>				<!-- Payment summary -->
				{#if resumenPago && $form.monto && parseFloat($form.monto.toString()) > 0}
					{#if resumenPago.error}
						<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
							<p class="font-medium text-red-800">❌ {resumenPago.mensaje}</p>
							<p class="text-xs text-red-700">Mínimo requerido: $${resumenPago.montoMinimoRequerido.toFixed(2)}</p>
						</div>
					{:else}
						<div class="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
							<h4 class="font-medium text-blue-800">Resumen del pago:</h4>							<div class="mt-2 space-y-1 text-blue-700">
								<div class="flex justify-between">
									<span>Plan {resumenPago.esPagoParcial ? '(Parcial)' : '(Completo)'}:</span>
									<span class="font-medium">${(resumenPago.montoAlPlan || 0).toFixed(2)}</span>
								</div>
								{#if (resumenPago.montoACuotas || 0) > 0}
								<div class="flex justify-between">
									<span>Cuotas:</span>
									<span class="font-medium">${(resumenPago.montoACuotas || 0).toFixed(2)}</span>
								</div>
								{/if}
								<div class="flex justify-between border-t border-blue-300 pt-1 font-bold">
									<span>Total:</span>
									<span>${(resumenPago.montoTotal || 0).toFixed(2)}</span>
								</div>
								{#if resumenPago.esPagoParcial}
								<p class="text-xs text-amber-700">⚠️ Pago parcial: Estado será "Pendiente"</p>
								{/if}
							</div>
						</div>
					{/if}
				{/if}
				
				<!-- Componente de resumen -->
				<RenovacionResumen
					planSeleccionado={$planSeleccionado}
					cuotasPendientes={$cuotasPendientes}
					precioTotal={$precioTotal}
					form={$form}
				/>
			</div>
		</form>
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
