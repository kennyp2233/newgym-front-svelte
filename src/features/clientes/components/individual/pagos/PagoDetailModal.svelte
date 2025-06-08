<!-- src/features/clientes/components/individual/pagos/PagoDetailModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import type { PagoDTO } from '../../../../pagos/api';
	import { pagoService } from '../../../../pagos/api';
	import type { Cliente } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	import { createPagoStore, pagoUtils } from '../../../../pagos/composables/pagoComposables';
	import {
		editarPagoValidationSchema,
		createEditarPagoValidationSchema
	} from '../../../../pagos/forms/validationSchemas';
	import PagoResumen from '../../../../pagos/components/PagoResumen.svelte';
	import PagoEstadoChip from '../../../../pagos/components/PagoEstadoChip.svelte';
	// MetodoPagoChip removed as per new requirements - payment method no longer tracked
	export let isOpen = false;
	export let cliente: Cliente;
	export let pago: PagoDTO;
	export let canEdit = true; // Nueva prop para controlar si se puede editar
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	// Estados usando composable
	const pagoStore = createPagoStore(cliente.idCliente);	// Para pagos con cuotas de mantenimiento, separar los montos
	// CORREGIDO: Usar el nuevo campo montoCuotaMantenimiento si está disponible
	$: montoCuotasMantenimiento = pago.montoCuotaMantenimiento || 
		(pago.cuotasMantenimiento?.reduce((sum, cuota) => sum + cuota.monto, 0) || 0);
	
	// CORREGIDO: Con la nueva estructura, pago.monto YA es solo el monto del plan
	// No necesitamos restar las cuotas porque el backend ahora envía campos separados:
	// - pago.monto = monto del plan únicamente
	// - pago.montoCuotaMantenimiento = monto de cuotas de mantenimiento
	// - pago.montoTotal = monto total
	$: montoPlanActual = pago.monto;

	// Calcular monto máximo permitido para este pago
	$: montoMaximoPermitido = pagoService.identificarPagoConCuotas(pago)
		? 999999 // Para pagos con cuotas, permitir cualquier monto razonable para el plan
		: pagoUtils.calcularMontoMaximoPermitido(pago);
	// Alias para la validación con monto máximo dinámico
	$: validationSchema = createEditarPagoValidationSchema(
		montoMaximoPermitido,
		pagoService.identificarPagoConCuotas(pago) // Permitir $0 para pagos con cuotas
	);

	let isEditing = false;
	let isSubmitting = false;
	let showDeleteConfirm = false;

	// Configuración del formulario con valores iniciales del pago
	const { form, errors, touched, updateField } = createForm({
		initialValues: {
			monto: montoPlanActual,
			referencia: pago.referencia || '',
			observaciones: pago.observaciones || ''
		},
		onSubmit: () => {} // Empty function since we handle submission manually
	});

	// Wrapper para updateField siguiendo el patrón del formulario principal
	const updateFieldWrapper = (field: string, value: any) => {
		updateField(field as keyof typeof $form, value);
		// Force reactivity by updating the form store directly
		form.update((current) => ({
			...current,
			[field]: value
		}));
	};
	// Función de validación manual siguiendo el patrón del formulario principal
	async function validateForm(): Promise<boolean> {
		try {
			await validationSchema.validate($form, { abortEarly: false });
			// Si la validación pasa, limpiar errores
			const emptyErrors: Record<string, string> = {};
			Object.keys($form).forEach((key) => (emptyErrors[key] = ''));
			errors.set(emptyErrors);
			return true;
		} catch (yupError: any) {
			const newErrors: Record<string, string> = {};
			if (yupError.inner && yupError.inner.length > 0) {
				yupError.inner.forEach((err: any) => {
					if (err.path) {
						newErrors[err.path] = err.message;
					}
				});
			} else if (yupError.path) {
				newErrors[yupError.path] = yupError.message;
			}

			// Actualizar errores
			errors.set(newErrors);

			// Marcar campos como touched
			const newTouched: Record<string, boolean> = {};
			Object.keys($form).forEach((key) => (newTouched[key] = true));
			touched.set(newTouched as any);
			return false;
		}
	}
	// Función de submit manual - ACTUALIZADA para manejar pagos con cuotas de mantenimiento separadamente
	async function handleSubmitForm() {
		const isValid = await validateForm();

		if (!isValid) {
			toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
			return;
		}
		isSubmitting = true;		try {
			// Handle empty monto field properly to avoid NaN
			const montoPlanIngresado = $form.monto ? parseFloat($form.monto.toString()) : 0;

			// Con la nueva estructura del backend, solo enviamos el monto del plan
			// Las cuotas de mantenimiento se mantienen como un campo separado
			const pagoData = {
				monto: montoPlanIngresado, // Solo el monto del plan
				montoCuotaMantenimiento: pagoService.identificarPagoConCuotas(pago) ? montoCuotasMantenimiento : undefined,
				// metodoPago field removed as per new requirements
				// estado field calculated automatically by frontend logic based on payment amount vs expected total
				referencia: $form.referencia || undefined,
				observaciones: $form.observaciones || undefined
			};

			await pagoStore.actualizarPago(pago.idPago!, pagoData);
			toasts.showToast('Pago actualizado correctamente', 'success');
			isEditing = false;
			onSuccess();
		} catch (error) {
			console.error('Error al actualizar pago:', error);
			toasts.showToast('Error al actualizar pago', 'error');
		} finally {
			isSubmitting = false;
		}
	}
	// Formatear fecha usando utilidad
	const formatDate = pagoUtils.formatearFecha;

	// Función para eliminar pago
	async function handleDelete() {
		isSubmitting = true;
		try {
			await pagoStore.eliminarPago(pago.idPago!);
			toasts.showToast('Pago eliminado correctamente', 'success');
			onSuccess();
		} catch (error) {
			console.error('Error al eliminar pago:', error);
			toasts.showToast('Error al eliminar pago', 'error');
		} finally {
			isSubmitting = false;
			showDeleteConfirm = false;
		}
	}

	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing) {
			// Resetear valores del formulario usando el wrapper
			updateFieldWrapper('monto', montoPlanActual.toString());
			// metodoPago field removed as per new requirements
			// estado field removed - backend calculates state automatically
			updateFieldWrapper('referencia', pago.referencia || '');
			updateFieldWrapper('observaciones', pago.observaciones || '');
		}
	}

	$: caracteresRestantes = 150 - ($form.observaciones?.length || 0);
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>
	<svelte:fragment slot="header">
		<div class="flex w-full items-center justify-between">
			<h3 class="text-lg font-semibold">
				{isEditing ? 'Editar Pago' : 'Ver Pago'}
			</h3>
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-500">
					{formatDate(pago.fechaPago)}
				</span>
				<PagoEstadoChip estado={pago.estado || 'Pendiente'} />
			</div>
		</div>
	</svelte:fragment>
	{#if isEditing}
		<!-- MODO EDICIÓN -->
		<form on:submit|preventDefault={handleSubmitForm}>
			<div class="space-y-4">
				<p class="mb-4 text-sm text-gray-600">
					Editar pago de <strong>{cliente.nombre} {cliente.apellido}</strong>
				</p>

				<!-- Advertencia sobre restricciones de edición para pagos con cuotas de mantenimiento -->
				{#if pagoService.identificarPagoConCuotas(pago)}
					<div class="rounded-md border border-blue-200 bg-blue-50 p-4">
						<h4 class="mb-2 font-bold text-blue-800">ℹ️ Pago con Cuotas de Mantenimiento</h4>
						<p class="mb-3 text-sm text-blue-700">
							Este pago incluye cuotas de mantenimiento. Solo puedes editar el monto del plan.
						</p>
						{#if pago.cuotasMantenimiento && pago.cuotasMantenimiento.length > 0}
							<div class="bg-blue-25 space-y-2 rounded-md border border-blue-100 p-3">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-blue-700">Monto del Plan (editable):</span>
									<span class="text-sm font-bold text-blue-800">${montoPlanActual.toFixed(2)}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-blue-700"
										>Cuotas de Mantenimiento (fijas):</span
									>
									<span class="text-sm font-bold text-blue-800"
										>${montoCuotasMantenimiento.toFixed(2)}</span
									>
								</div>
								<div class="flex items-center justify-between border-t border-blue-200 pt-2">
									<span class="text-sm font-bold text-blue-900">Total del Pago:</span>
									<span class="text-sm font-bold text-blue-900"
										>${(montoPlanActual + montoCuotasMantenimiento).toFixed(2)}</span
									>
								</div>
							</div>
						{/if}
						<p class="mt-2 text-xs text-blue-600">
							El monto del plan puede ser desde $0.00 hasta cualquier valor. Las cuotas de
							mantenimiento no se modifican.
						</p>
					</div>
				{/if}
				<div class="space-y-4">
					<FormField
						name="monto"
						label={pagoService.identificarPagoConCuotas(pago) ? 'Monto del Plan' : 'Monto'}
						type="number"
						placeholder="0.00"
						unit="$"
						step="0.01"
						helperText={pagoService.identificarPagoConCuotas(pago)
							? `Puedes editar el monto del plan desde $0.00. Las cuotas de mantenimiento ($${montoCuotasMantenimiento.toFixed(2)}) no se modifican.`
							: undefined}
						bind:value={$form.monto}
						errors={$errors}
						touched={$touched}
					/>

					<!-- Mostrar cálculo dinámico del total para pagos con cuotas -->
					{#if pagoService.identificarPagoConCuotas(pago)}
						<div class="rounded-md border border-green-200 bg-green-50 p-3">
							<h5 class="mb-2 text-sm font-semibold text-green-800">Cálculo del Total</h5>
							<div class="space-y-1 text-sm text-green-700">
								<div class="flex justify-between">
									<span>Monto del Plan:</span>
									<span class="font-semibold"
										>${($form.monto ? parseFloat($form.monto.toString()) : 0).toFixed(2)}</span
									>
								</div>
								<div class="flex justify-between">
									<span>Cuotas de Mantenimiento:</span>
									<span class="font-semibold">${montoCuotasMantenimiento.toFixed(2)}</span>
								</div>
								<div
									class="flex justify-between border-t border-green-300 pt-1 font-bold text-green-900"
								>
									<span>Total del Pago:</span>
									<span
										>${(
											($form.monto ? parseFloat($form.monto.toString()) : 0) +
											montoCuotasMantenimiento
										).toFixed(2)}</span
									>
								</div>
							</div>
						</div>
					{/if}

					<FormField
						name="referencia"
						label="Referencia"
						placeholder="Ej: TRF-123456"
						bind:value={$form.referencia}
						errors={$errors}
						touched={$touched}
					/>

					<div class="w-full space-y-1.5">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-md font-bold text-[var(--letter)]">Observaciones</label>
						<textarea
							name="observaciones"
							bind:value={$form.observaciones}
							class="flex min-h-[80px] w-full rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Comentarios adicionales sobre el pago..."
							maxlength="150"
						></textarea>
						<p class={`text-sm ${caracteresRestantes < 10 ? 'text-red-500' : 'text-gray-500'}`}>
							{caracteresRestantes} caracteres restantes
						</p>
					</div>
				</div>
			</div>
		</form>
	{:else}
		<!-- MODO VISTA -->
		<div class="space-y-4">
			<p class="mb-4 text-sm text-gray-600">
				Detalles del pago de <strong>{cliente.nombre} {cliente.apellido}</strong>
			</p>
			<!-- Usar componente PagoResumen modular -->
			<PagoResumen {pago} showPlan={true} showFechas={true} />

		</div>
	{/if}

	<svelte:fragment slot="footer">
		{#if showDeleteConfirm}
			<div class="flex w-full items-center justify-between">
				<p class="text-sm text-red-600">¿Confirmas eliminar este pago?</p>
				<div class="flex gap-2">
					<Button variant="outline" size="sm" on:click={() => (showDeleteConfirm = false)}>
						Cancelar
					</Button>
					<Button variant="danger" size="sm" on:click={handleDelete} isLoading={isSubmitting}>
						Eliminar
					</Button>
				</div>
			</div>
		{:else if isEditing}
			<Button variant="outline" on:click={toggleEdit} type="button">Cancelar</Button>
			
			<Button variant="primary" on:click={handleSubmitForm} type="button" isLoading={isSubmitting}>
				Guardar Cambios
			</Button>
		{:else}
			<Button variant="outline" on:click={onClose}>Cerrar</Button>
			{#if canEdit}
				
				<Button variant="primary" on:click={toggleEdit}>
					<Icon name="edit" size={16} className="mr-2" />
					Editar Pago
				</Button>
			{:else}
				<div class="text-sm text-gray-500">Solo se puede editar el pago más reciente</div>
			{/if}
		{/if}
	</svelte:fragment>
</BaseModal>
