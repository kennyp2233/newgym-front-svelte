<!-- src/features/clientes/components/individual/medidas/NuevaMedidaModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import {
		createMedidasListStore,
		medidaUtils
	} from '../../../../medidas/composables/medidaComposables';
	import type { Cliente } from '../../../api';
	import { TipoOcupacion } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	import * as yup from 'yup';
	export let isOpen = false;
	export let cliente: Cliente;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	// Crear el store de medidas para este cliente
	const medidasStore = createMedidasListStore(cliente.idCliente);
	const { crearMedida } = medidasStore;

	let isSubmitting = false;
	let imc = '';
	let categoriaPeso = '';

	const esNino = cliente.ocupacion === TipoOcupacion.NINO; // Esquema de validación adaptado según la ocupación
	const validationSchema = yup.object({
		peso: yup.number().required('El peso es requerido'),
		altura: yup.number().required('La altura es requerida'),
		// Los siguientes campos son opcionales para flexibilidad en el registro
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
	// Configuración del formulario (sin validationSchema para manejar validación manual)
	const { form, errors, touched, updateField } = createForm({
		initialValues: {
			peso: '',
			altura: '',
			brazos: '',
			pantorrillas: '',
			gluteo: '',
			muslos: '',
			pecho: '',
			cintura: '',
			cuello: ''
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

	// Función de submit manual
	async function handleSubmitForm() {
		const isValid = await validateForm();

		if (!isValid) {
			toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
			return;
		}

		isSubmitting = true;
		try {
			// Crear objeto de medida con o sin medidas adicionales según la ocupación
			const medidaData = {
				idCliente: cliente.idCliente,
				peso: parseFloat($form.peso),
				altura: parseFloat($form.altura),
				imc: parseFloat(imc),
				categoriaPeso, // Si es niño, solo enviamos peso y altura
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
			await crearMedida(medidaData);
			onSuccess();
			onClose(); // Cerrar el modal después del éxito
		} catch (error) {
			// El error ya se maneja en el composable
		} finally {
			isSubmitting = false;
		}
	}
	// Función para calcular IMC usando el composable
	function calcularIMC(peso: number, altura: number) {
		if (!peso || !altura) return;

		const resultado = medidaUtils.calcularIMC(peso, altura);
		if (resultado) {
			imc = resultado.imc.toString();
			categoriaPeso = resultado.categoria;
		}
	}

	// Reactivos para calcular IMC automáticamente
	$: if ($form.peso && $form.altura) {
		calcularIMC(parseFloat($form.peso), parseFloat($form.altura));
	}
	// Función para validar rangos usando el composable
	function validateRange(value: string | number, min: number, max: number): boolean {
		return medidaUtils.validateRange(value, min, max);
	}

	// Determinar si mostrar advertencia de rango usando el composable
	function getRangeWarning(field: string, value: string | number): string {
		return medidaUtils.getRangeWarning(field, value);
	}
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">Nueva Medida</h3>
	</svelte:fragment>

	<form on:submit|preventDefault={handleSubmitForm}>
		<div class="space-y-4">
			<p class="mb-4 text-sm text-gray-600">
				Registra las nuevas medidas para <strong>{cliente.nombre} {cliente.apellido}</strong>
			</p>

			<FormRow>
				<div class="space-y-1.5">
					<FormField
						name="peso"
						label="Peso"
						type="number"
						placeholder="Ej. 70"
						unit="kg"
						min={1}
						max={300}
						bind:value={$form.peso}
						errors={$errors}
						touched={$touched}
					/>
					{#if $form.peso && !validateRange($form.peso, 1, 300)}
						<p class="text-sm text-amber-600">⚠️ {getRangeWarning('peso', $form.peso)}</p>
					{/if}
				</div>

				<div class="space-y-1.5">
					<FormField
						name="altura"
						label="Altura"
						type="number"
						placeholder="Ej. 170"
						unit="cm"
						min={30}
						max={250}
						bind:value={$form.altura}
						errors={$errors}
						touched={$touched}
					/>
					{#if $form.altura && !validateRange($form.altura, 30, 250)}
						<p class="text-sm text-amber-600">⚠️ {getRangeWarning('altura', $form.altura)}</p>
					{/if}
				</div>
			</FormRow>
			{#if !esNino}
				<FormRow>
					<FormField
						name="brazos"
						label="Brazos (Opcional)"
						type="number"
						placeholder="Ej. 55.5"
						unit="cm"
						min={1}
						max={200}
						bind:value={$form.brazos}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="pantorrillas"
						label="Pantorrillas (Opcional)"
						type="number"
						placeholder="Ej. 55.5"
						unit="cm"
						min={1}
						max={200}
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
						placeholder="Ej. 55.5"
						unit="cm"
						min={1}
						max={200}
						bind:value={$form.gluteo}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="muslos"
						label="Muslos (Opcional)"
						type="number"
						placeholder="Ej. 55.5"
						unit="cm"
						min={1}
						max={200}
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
						placeholder="Ej. 55.5"
						unit="cm"
						min={1}
						max={200}
						bind:value={$form.pecho}
						errors={$errors}
						touched={$touched}
					/><FormField
						name="cintura"
						label="Cintura (Opcional)"
						type="number"
						placeholder="Ej. 55.5"
						unit="cm"
						min={1}
						max={200}
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
						placeholder="Ej. 35.5"
						unit="cm"
						min={1}
						max={100}
						bind:value={$form.cuello}
						errors={$errors}
						touched={$touched}
					/>
					<div></div>
				</FormRow>
			{/if}

			<!-- Mostrar IMC calculado -->
			<div
				class="bg-opacity-10 mt-6 flex flex-col items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--sections)] p-4"
			>
				<span class="text-sm font-medium text-[var(--letter)]">Índice de Masa Corporal (IMC)</span>
				<p class="text-center text-xl font-bold text-[var(--letter)]">
					{$form.peso && $form.altura ? `${imc} - ${categoriaPeso}` : 'Pendiente de cálculo'}
				</p>
				{#if !esNino}
					<p class="mt-2 text-center text-xs text-gray-500">
						💡 <strong>Tip:</strong> Puedes omitir las medidas detalladas si solo necesitas registrar
						datos básicos del cliente.
					</p>
				{/if}

				{#if $form.peso && $form.altura}
					<div class="mt-2 text-center text-xs text-gray-500">
						<p>Peso: {$form.peso} kg • Altura: {$form.altura} cm</p>
					</div>
				{/if}
			</div>
		</div>
	</form>
	<svelte:fragment slot="footer">
		<Button variant="outline" on:click={onClose} type="button">Cancelar</Button>
		<Button variant="primary" on:click={handleSubmitForm} type="button" isLoading={isSubmitting}>
			Guardar medida
		</Button>
	</svelte:fragment>
</BaseModal>
