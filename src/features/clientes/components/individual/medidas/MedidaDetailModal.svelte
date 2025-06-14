<!-- src/features/clientes/components/individual/medidas/MedidaDetailModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import {
		createMedidasListStore,
		medidaUtils,
		type Medida
	} from '../../../../medidas/composables/medidaComposables';
	import type { Cliente } from '../../../api';
	import { TipoOcupacion } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	import * as yup from 'yup';
	export let isOpen = false;
	export let cliente: Cliente;
	export let medida: Medida;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	// Crear el store de medidas para este cliente
	const medidasStore = createMedidasListStore(cliente.idCliente);
	const { actualizarMedida } = medidasStore;

	let isEditing = false;
	let isSubmitting = false;
	let imc = '';
	let categoriaPeso = '';

	const esNino = cliente.ocupacion === TipoOcupacion.NINO; // Esquema de validación
	const validationSchema = yup.object({
		peso: yup.number().required('El peso es requerido'),
		altura: yup.number().required('La altura es requerida'),
		...(esNino
			? {}
			: {
					brazos: yup
						.mixed()
						.test('is-number-or-empty', 'Debe ser un número válido', (value) => {
							if (value === '' || value === null || value === undefined) return true;
							return !isNaN(Number(value)) && Number(value) >= 0;
						})
						.nullable(),
					pantorrillas: yup
						.mixed()
						.test('is-number-or-empty', 'Debe ser un número válido', (value) => {
							if (value === '' || value === null || value === undefined) return true;
							return !isNaN(Number(value)) && Number(value) >= 0;
						})
						.nullable(),
					gluteo: yup
						.mixed()
						.test('is-number-or-empty', 'Debe ser un número válido', (value) => {
							if (value === '' || value === null || value === undefined) return true;
							return !isNaN(Number(value)) && Number(value) >= 0;
						})
						.nullable(),
					muslos: yup
						.mixed()
						.test('is-number-or-empty', 'Debe ser un número válido', (value) => {
							if (value === '' || value === null || value === undefined) return true;
							return !isNaN(Number(value)) && Number(value) >= 0;
						})
						.nullable(),
					pecho: yup
						.mixed()
						.test('is-number-or-empty', 'Debe ser un número válido', (value) => {
							if (value === '' || value === null || value === undefined) return true;
							return !isNaN(Number(value)) && Number(value) >= 0;
						})
						.nullable(),
					cintura: yup
						.mixed()
						.test('is-number-or-empty', 'Debe ser un número válido', (value) => {
							if (value === '' || value === null || value === undefined) return true;
							return !isNaN(Number(value)) && Number(value) >= 0;
						})
						.nullable(),
					cuello: yup
						.mixed()
						.test('is-number-or-empty', 'Debe ser un número válido', (value) => {
							if (value === '' || value === null || value === undefined) return true;
							return !isNaN(Number(value)) && Number(value) >= 0;
						})
						.nullable()
				})
	});
	// Configuración del formulario con valores iniciales de la medida (sin validationSchema para manejar validación manual)
	const { form, errors, touched, updateField } = createForm({
		initialValues: {
			peso: medida.peso?.toString() || '',
			altura: medida.altura?.toString() || '',
			brazos: medida.brazos?.toString() || '',
			pantorrillas: medida.pantorrillas?.toString() || '',
			gluteo: medida.gluteo?.toString() || '',
			muslos: medida.muslos?.toString() || '',
			pecho: medida.pecho?.toString() || '',
			cintura: medida.cintura?.toString() || '',
			cuello: medida.cuello?.toString() || ''
		},
		onSubmit: () => {} // Empty function since we handle submission manually
	});

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

	// Función de submit manual
	async function handleSubmitForm() {
		const isValid = await validateForm();

		if (!isValid) {
			toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
			return;
		}

		isSubmitting = true;
		try {
			const medidaData = {
				peso: parseFloat($form.peso),
				altura: parseFloat($form.altura),
				imc: parseFloat(imc),
				categoriaPeso,
				...(esNino
					? {}
					: {
							brazos: $form.brazos ? parseFloat($form.brazos) : undefined,
							pantorrillas: $form.pantorrillas ? parseFloat($form.pantorrillas) : undefined,
							gluteo: $form.gluteo ? parseFloat($form.gluteo) : undefined,
							muslos: $form.muslos ? parseFloat($form.muslos) : undefined,
							pecho: $form.pecho ? parseFloat($form.pecho) : undefined,
							cintura: $form.cintura ? parseFloat($form.cintura) : undefined,
							cuello: $form.cuello ? parseFloat($form.cuello) : undefined
						})
			};
			await actualizarMedida(medida.idMedida, medidaData);
			isEditing = false;
			onSuccess();
		} catch (error) {
			// El error ya se maneja en el composable
		} finally {
			isSubmitting = false;
		}
	}
	// Función para calcular IMC usando el composable
	function calcularIMC(peso: number, altura: number) {
		if (!peso || !altura) {
			imc = '';
			categoriaPeso = '';
			return;
		}

		const resultado = medidaUtils.calcularIMC(peso, altura);
		if (resultado) {
			imc = resultado.imc.toString();
			categoriaPeso = resultado.categoria;
		}
	}

	// Inicializar IMC con valores de la medida existente
	$: if (medida && medida.peso && medida.altura) {
		calcularIMC(medida.peso, medida.altura);
	}

	// Reactivos para recalcular IMC cuando cambien los valores en modo edición
	$: if (isEditing && $form.peso && $form.altura) {
		calcularIMC(parseFloat($form.peso), parseFloat($form.altura));
	}
	// Formatear fecha usando el composable
	function formatDate(dateString: string): string {
		return medidaUtils.formatDate(dateString);
	}
	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing) {
			// Resetear valores del formulario si se cancela la edición usando updateField
			updateFieldWrapper('peso', medida.peso?.toString() || '');
			updateFieldWrapper('altura', medida.altura?.toString() || '');
			updateFieldWrapper('brazos', medida.brazos?.toString() || '');
			updateFieldWrapper('pantorrillas', medida.pantorrillas?.toString() || '');
			updateFieldWrapper('gluteo', medida.gluteo?.toString() || '');
			updateFieldWrapper('muslos', medida.muslos?.toString() || '');
			updateFieldWrapper('pecho', medida.pecho?.toString() || '');
			updateFieldWrapper('cintura', medida.cintura?.toString() || '');
			updateFieldWrapper('cuello', medida.cuello?.toString() || '');
		}
	}
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>
	<svelte:fragment slot="header">
		<div class="flex w-full items-center justify-between">
			<h3 class="text-lg font-semibold">
				{isEditing ? 'Editar Medida' : 'Ver Medida'}
			</h3>
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-500">
					{formatDate(medida.createdAt)}
				</span>
			</div>
		</div>
	</svelte:fragment>

	{#if isEditing}
		<!-- MODO EDICIÓN -->
		<form on:submit|preventDefault={handleSubmitForm}>
			<div class="space-y-4">
				<p class="mb-4 text-sm text-gray-600">
					Editar medidas de <strong>{cliente.nombre} {cliente.apellido}</strong>
				</p>

				<FormRow>
					<FormField
						name="peso"
						label="Peso"
						type="number"
						placeholder="Ej. 70"
						unit="kg"
						bind:value={$form.peso}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="altura"
						label="Altura"
						type="number"
						placeholder="Ej. 170"
						unit="cm"
						bind:value={$form.altura}
						errors={$errors}
						touched={$touched}
					/>
				</FormRow>

				{#if !esNino}
					<FormRow>
						<FormField
							name="brazos"
							label="Brazos (Opcional)"
							type="number"
							placeholder="Ej. 30"
							unit="cm"
							bind:value={$form.brazos}
							errors={$errors}
							touched={$touched}
						/>
						<FormField
							name="pantorrillas"
							label="Pantorrillas (Opcional)"
							type="number"
							placeholder="Ej. 35"
							unit="cm"
							bind:value={$form.pantorrillas}
							errors={$errors}
							touched={$touched}
						/>
					</FormRow>

					<FormRow>
						<FormField
							name="gluteo"
							label="Glúteo (Opcional)"
							type="number"
							placeholder="Ej. 95"
							unit="cm"
							bind:value={$form.gluteo}
							errors={$errors}
							touched={$touched}
						/>
						<FormField
							name="muslos"
							label="Muslos (Opcional)"
							type="number"
							placeholder="Ej. 50"
							unit="cm"
							bind:value={$form.muslos}
							errors={$errors}
							touched={$touched}
						/>
					</FormRow>

					<FormRow>
						<FormField
							name="pecho"
							label="Pecho (Opcional)"
							type="number"
							placeholder="Ej. 90"
							unit="cm"
							bind:value={$form.pecho}
							errors={$errors}
							touched={$touched}
						/><FormField
							name="cintura"
							label="Cintura (Opcional)"
							type="number"
							placeholder="Ej. 80"
							unit="cm"
							bind:value={$form.cintura}
							errors={$errors}
							touched={$touched}
						/>
					</FormRow>

					<FormRow>
						<FormField
							name="cuello"
							label="Cuello (Opcional)"
							type="number"
							placeholder="Ej. 35"
							unit="cm"
							bind:value={$form.cuello}
							errors={$errors}
							touched={$touched}
						/>
						<div></div>
					</FormRow>
				{/if}

				<!-- Mostrar IMC calculado -->
				{#if $form.peso && $form.altura}
					<div class="mt-4 rounded-md bg-gray-50 p-4">
						<p class="font-medium">Índice de Masa Corporal:</p>
						<p class="text-lg">{imc} - <span class="font-bold">{categoriaPeso}</span></p>
					</div>
				{/if}
			</div>
		</form>
	{:else}
		<!-- MODO VISTA -->
		<div class="space-y-4">
			<p class="mb-4 text-sm text-gray-600">
				Medidas de <strong>{cliente.nombre} {cliente.apellido}</strong>
			</p>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h4 class="mb-3 font-semibold text-gray-700">Medidas Básicas</h4>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">Peso:</span>
							<span class="font-medium">{medida.peso?.toFixed(1) || '-'} kg</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Altura:</span>
							<span class="font-medium">{medida.altura?.toFixed(1) || '-'} cm</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">IMC:</span>
							<span class="font-medium">{medida.imc?.toFixed(2) || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Categoría:</span>
							<span class="font-medium">{medida.categoriaPeso || '-'}</span>
						</div>
					</div>
				</div>

				{#if !esNino}
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<h4 class="mb-3 font-semibold text-gray-700">Medidas Detalladas</h4>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Brazos:</span>
								<span class="font-medium">{medida.brazos?.toFixed(1) || '-'} cm</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Pantorrillas:</span>
								<span class="font-medium">{medida.pantorrillas?.toFixed(1) || '-'} cm</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Glúteo:</span>
								<span class="font-medium">{medida.gluteo?.toFixed(1) || '-'} cm</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Muslos:</span>
								<span class="font-medium">{medida.muslos?.toFixed(1) || '-'} cm</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Pecho:</span>
								<span class="font-medium">{medida.pecho?.toFixed(1) || '-'} cm</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Cintura:</span>
								<span class="font-medium">{medida.cintura?.toFixed(1) || '-'} cm</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Cuello:</span>
								<span class="font-medium">{medida.cuello?.toFixed(1) || '-'} cm</span>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- IMC Destacado -->
			<div
				class="bg-opacity-10 mt-6 flex flex-col items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--sections)] p-4"
			>
				<span class="text-sm font-medium text-[var(--letter)]">Índice de Masa Corporal (IMC)</span>
				<p class="text-center text-xl font-bold text-[var(--letter)]">
					{medida.imc?.toFixed(2) || '-'} - {medida.categoriaPeso || 'No calculado'}
				</p>
				<div class="mt-2 text-center text-xs text-gray-500">
					<p>Registrado: {formatDate(medida.createdAt)}</p>
				</div>
			</div>
		</div>
	{/if}

	<svelte:fragment slot="footer">
		{#if isEditing}
			<Button variant="outline" on:click={toggleEdit} type="button">Cancelar</Button>
			<Button variant="primary" on:click={handleSubmitForm} type="button" isLoading={isSubmitting}>
				Guardar Cambios
			</Button>
		{:else}
			<Button variant="outline" on:click={onClose}>Cerrar</Button>
			<Button variant="primary" on:click={toggleEdit}>
				<Icon name="edit" size={16} className="mr-2" />
				Editar Medida
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
