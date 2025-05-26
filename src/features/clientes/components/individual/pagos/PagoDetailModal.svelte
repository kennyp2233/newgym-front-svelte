<!-- src/features/clientes/components/individual/pagos/PagoDetailModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { pagoService, type PagoDTO } from '../../../../pagos/api';
	import type { Cliente } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	import * as yup from 'yup';

	export let isOpen = false;
	export let cliente: Cliente;
	export let pago: PagoDTO;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	let isEditing = false;
	let isSubmitting = false;
	let showDeleteConfirm = false;

	// Esquema de validación
	const validationSchema = yup.object({
		monto: yup.number().required('El monto es requerido').min(1, 'El monto debe ser mayor a $1.00'),
		metodoPago: yup.string().nullable(),
		referencia: yup.string().nullable(),
		observaciones: yup
			.string()
			.max(150, 'Las observaciones no pueden exceder 150 caracteres')
			.nullable()
	});	// Configuración del formulario con valores iniciales del pago (sin validationSchema para manejar validación manual)
	const { form, errors, touched, updateField } = createForm({
		initialValues: {
			monto: pago.monto.toString(),
			metodoPago: pago.metodoPago || '',
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
			Object.keys($form).forEach(key => emptyErrors[key] = '');
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

	// Función de submit manual
	async function handleSubmitForm() {
		const isValid = await validateForm();
		
		if (!isValid) {
			toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
			return;
		}

		isSubmitting = true;
		try {
			const pagoData = {
				monto: parseFloat($form.monto),
				metodoPago: $form.metodoPago as 'Efectivo' | 'Transferencia' | 'Tarjeta' | undefined,
				referencia: $form.referencia || undefined,
				observaciones: $form.observaciones || undefined
			};

			await pagoService.updatePago(pago.idPago!, pagoData);
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

	// Formatear fecha
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Determinar color del estado
	function getEstadoColor(estado: string): string {
		switch (estado) {
			case 'Completado':
				return 'bg-green-100 text-green-800';
			case 'Pendiente':
				return 'bg-yellow-100 text-yellow-800';
			case 'Anulado':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing) {
			// Resetear valores del formulario usando el wrapper
			updateFieldWrapper('monto', pago.monto.toString());
			updateFieldWrapper('metodoPago', pago.metodoPago || '');
			updateFieldWrapper('referencia', pago.referencia || '');
			updateFieldWrapper('observaciones', pago.observaciones || '');
		}
	}

	async function handleDelete() {
		isSubmitting = true;
		try {
			const success = await pagoService.deletePago(pago.idPago!);
			if (success) {
				toasts.showToast('Pago eliminado correctamente', 'success');
				onSuccess();
			}
		} catch (error) {
			console.error('Error al eliminar pago:', error);
			toasts.showToast('Error al eliminar pago', 'error');
		} finally {
			isSubmitting = false;
			showDeleteConfirm = false;
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
				<Button variant={isEditing ? 'outline' : 'ghost'} size="sm" on:click={toggleEdit}>
					<Icon name={isEditing ? 'x' : 'edit'} size={16} className="mr-1" />
					{isEditing ? 'Cancelar' : 'Editar'}
				</Button>
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

				<FormRow>
					<FormField
						name="monto"
						label="Monto"
						type="number"
						placeholder="0.00"
						unit="$"
						step="0.01"
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
						name="referencia"
						label="Referencia"
						placeholder="Ej: TRF-123456"
						bind:value={$form.referencia}
						errors={$errors}
						touched={$touched}
					/>
					<div></div>
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

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h4 class="mb-3 font-semibold text-gray-700">Información del Pago</h4>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">Monto:</span>
							<span class="text-lg font-bold">${pago.monto.toFixed(2)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Método:</span>
							<span class="font-medium">{pago.metodoPago || 'No especificado'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Estado:</span>
							<span
								class={`rounded-full px-2 py-1 text-xs font-medium ${getEstadoColor(pago.estado || 'Pendiente')}`}
							>
								{pago.estado || 'Pendiente'}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Tipo:</span>
							<span
								class={`rounded-full px-2 py-1 text-xs font-medium ${pago.esRenovacion ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
							>
								{pago.esRenovacion ? 'Renovación' : 'Inscripción'}
							</span>
						</div>
					</div>
				</div>

				{#if pago.inscripcion}
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<h4 class="mb-3 font-semibold text-gray-700">Plan Asociado</h4>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Plan:</span>
								<span class="font-medium">{pago.inscripcion.plan?.nombre || 'No especificado'}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Precio del plan:</span>
								<span class="font-medium"
									>${pago.inscripcion.plan?.precio?.toFixed(2) || '0.00'}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Inicio:</span>
								<span
									>{pago.inscripcion.fechaInicio
										? formatDate(pago.inscripcion.fechaInicio)
										: '-'}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Fin:</span>
								<span
									>{pago.inscripcion.fechaFin ? formatDate(pago.inscripcion.fechaFin) : '-'}</span
								>
							</div>
						</div>
					</div>
				{/if}
			</div>

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
			<Button variant="danger" on:click={() => (showDeleteConfirm = true)}>
				<Icon name="trash" size={16} className="mr-2" />
				Eliminar
			</Button>
			<Button variant="primary" on:click={toggleEdit}>
				<Icon name="edit" size={16} className="mr-2" />
				Editar Pago
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
