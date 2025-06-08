<!-- src/features/clientes/components/individual/pagos/PagoDetailModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import type { PagoDTO } from '../../../../pagos/api';
	import { pagoService } from '../../../../pagos/api';
	import type { Cliente } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	// Importar componentes modulares
	import { createPagoStore, pagoUtils } from '../../../../pagos/composables/pagoComposables';
	import { editarPagoValidationSchema } from '../../../../pagos/forms/validationSchemas';
	import PagoResumen from '../../../../pagos/components/PagoResumen.svelte';
	import PagoEstadoChip from '../../../../pagos/components/PagoEstadoChip.svelte';
	import MetodoPagoChip from '../../../../pagos/components/MetodoPagoChip.svelte';
	export let isOpen = false;
	export let cliente: Cliente;
	export let pago: PagoDTO;
	export let canEdit = true; // Nueva prop para controlar si se puede editar
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};
	export let cuotasPendientesGlobales: any[] = []; // NUEVO: Para identificación mejorada// Estados usando composable
	const pagoStore = createPagoStore(cliente.idCliente);
	// Alias para la validación
	const validationSchema = editarPagoValidationSchema;

	let isEditing = false;
	let isSubmitting = false;
	let showDeleteConfirm = false;

	// Configuración del formulario con valores iniciales del pago
	const { form, errors, touched, updateField } = createForm({
		initialValues: {
			monto: pago.monto.toString(),
			metodoPago: pago.metodoPago || '',
			estado: pago.estado || 'Completado',
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
	// Función de submit manual - ACTUALIZADA para manejar restricciones de anualidad
	async function handleSubmitForm() {
		const isValid = await validateForm();

		if (!isValid) {
			toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
			return;
		}
		// Validación adicional para pagos con anualidad según documentación estricta
		if (pagoService.identificarPagoConCuotas(pago)) {
			const montoIngresado = parseFloat($form.monto);
			const montoPlan = pago.inscripcion?.plan?.precio || 0;

			if (montoIngresado < montoPlan) {
				toasts.showToast(
					`El monto del plan no puede ser menor a $${montoPlan.toFixed(2)}`,
					'error'
				);
				return;
			}
		}

		isSubmitting = true;
		try {
			const pagoData = {
				monto: parseFloat($form.monto),
				metodoPago: $form.metodoPago as 'Efectivo' | 'Transferencia' | 'Tarjeta' | undefined,
				estado: $form.estado as 'Completado' | 'Pendiente' | 'Anulado',
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
			updateFieldWrapper('monto', pago.monto.toString());
			updateFieldWrapper('metodoPago', pago.metodoPago || '');
			updateFieldWrapper('estado', pago.estado || 'Completado');
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
				</p>				<!-- Advertencia sobre restricciones de edición para pagos con anualidad según documentación -->
				{#if pagoService.identificarPagoConCuotas(pago, cuotasPendientesGlobales)}
					<div class="rounded-md border border-yellow-200 bg-yellow-50 p-4">
						<h4 class="mb-2 font-bold text-yellow-800">ℹ️ Pago con Cuota de Mantenimiento</h4>
						<p class="mb-2 text-sm text-yellow-700">
							Este pago incluye cuota de mantenimiento anual.
						</p>
						<div class="text-sm text-yellow-600">
							<p><strong>Plan:</strong> ${(pago.inscripcion?.plan?.precio || 0).toFixed(2)}</p>
							<p>
								<strong>Cuota anual:</strong> ${(pago.montoAnualidad || 0).toFixed(2)} (no editable)
							</p>
							<p><strong>Formato del monto:</strong> {pagoService.formatearPagoConCuotas(pago)}</p>
						</div>
						<p class="mt-2 text-xs text-yellow-600">
							Solo puedes editar el costo del plan, no la cuota de mantenimiento.
						</p>
					</div>
				{/if}

				<FormRow>					<FormField
						name="monto"
						label={pagoService.identificarPagoConCuotas(pago, cuotasPendientesGlobales) ? 'Monto del Plan (editable)' : 'Monto'}
						type="number"
						placeholder="0.00"
						unit="$"
						step="0.01"
						helperText={pagoService.identificarPagoConCuotas(pago, cuotasPendientesGlobales)
							? `Cuota anual fija: $${(pago.montoAnualidad || 0).toFixed(2)}`
							: undefined}
						bind:value={$form.monto}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="metodoPago"
						label="Método de pago"
						type="select"
						options={[
							{ value: '', label: 'No especificado' },
							{ value: 'Efectivo', label: 'Efectivo' },
							{ value: 'Transferencia', label: 'Transferencia' },
							{ value: 'Tarjeta', label: 'Tarjeta de crédito/débito' }
						]}
						bind:value={$form.metodoPago}
						errors={$errors}
						touched={$touched}
					/>
				</FormRow>

				<FormRow>
					<FormField
						name="estado"
						label="Estado"
						type="select"
						options={[
							{ value: 'Pendiente', label: 'Pendiente' },
							{ value: 'Completado', label: 'Completado' },
							{ value: 'Anulado', label: 'Anulado' }
						]}
						bind:value={$form.estado}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="referencia"
						label="Referencia"
						placeholder="Ej: TRF-123456"
						bind:value={$form.referencia}
						errors={$errors}
						touched={$touched}
					/>
				</FormRow>

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
		</form>
	{:else}
		<!-- MODO VISTA -->
		<div class="space-y-4">
			<p class="mb-4 text-sm text-gray-600">
				Detalles del pago de <strong>{cliente.nombre} {cliente.apellido}</strong>
			</p>
			<!-- Usar componente PagoResumen modular -->
			<PagoResumen {pago} showPlan={true} showFechas={true} />

			{#if pago.referencia}
				<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
					<h4 class="mb-2 font-semibold text-blue-800">Referencia</h4>
					<p class="text-sm text-blue-700">{pago.referencia}</p>
				</div>
			{/if}

			{#if pago.observaciones}
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h4 class="mb-2 font-semibold text-gray-700">Observaciones</h4>
					<p class="text-sm text-gray-600">{pago.observaciones}</p>
				</div>
			{/if}
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
			<Button variant="danger" on:click={() => (showDeleteConfirm = true)} type="button">
				<Icon name="trash" size={16} className="mr-2" />
				Eliminar
			</Button>
			<Button variant="primary" on:click={handleSubmitForm} type="button" isLoading={isSubmitting}>
				Guardar Cambios
			</Button>
		{:else}
			<Button variant="outline" on:click={onClose}>Cerrar</Button>
			{#if canEdit}
				<Button variant="danger" on:click={() => (showDeleteConfirm = true)}>
					<Icon name="trash" size={16} className="mr-2" />
					Eliminar
				</Button>
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
