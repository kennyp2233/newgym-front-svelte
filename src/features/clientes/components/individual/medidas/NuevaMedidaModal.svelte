<!-- src/features/clientes/components/individual/medidas/NuevaMedidaModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { medidaService } from '../../../../medidas/api';
	import type { Cliente } from '../../../api';
	import { TipoOcupacion } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	import * as yup from 'yup';

	export let isOpen = false;
	export let cliente: Cliente;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	let isSubmitting = false;
	let imc = '';
	let categoriaPeso = '';

	const esNino = cliente.ocupacion === TipoOcupacion.NINO;

	// Esquema de validación adaptado según la ocupación
	const validationSchema = yup.object({
		peso: yup.number().required('El peso es requerido'),
		altura: yup.number().required('La altura es requerida'),
		// Los siguientes campos solo son requeridos si no es un niño
		...(esNino
			? {}
			: {
					brazos: yup.number().required('La medida de brazos es requerida'),
					pantorrillas: yup.number().required('La medida de pantorrillas es requerida'),
					gluteo: yup.number().required('La medida de glúteo es requerida'),
					muslos: yup.number().required('La medida de muslos es requerida'),
					pecho: yup.number().required('La medida de pecho es requerida'),
					cintura: yup.number().required('La medida de cintura es requerida')
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
			// Crear objeto de medida con o sin medidas adicionales según la ocupación
			const medidaData = {
				idCliente: cliente.idCliente,
				peso: parseFloat($form.peso),
				altura: parseFloat($form.altura),
				imc: parseFloat(imc),
				categoriaPeso,
				// Si es niño, solo enviamos peso y altura
				...(esNino
					? {}
					: {
							brazos: parseFloat($form.brazos),
							pantorrillas: parseFloat($form.pantorrillas),
							gluteo: parseFloat($form.gluteo),
							muslos: parseFloat($form.muslos),
							pecho: parseFloat($form.pecho),
							cintura: parseFloat($form.cintura),
							cuello: $form.cuello ? parseFloat($form.cuello) : undefined
						})
			};

			await medidaService.createMedida(medidaData);
			toasts.showToast('Medida registrada correctamente', 'success');
			onSuccess();
		} catch (error) {
			console.error('Error al registrar medida:', error);
			toasts.showToast('Error al registrar medida', 'error');
		} finally {
			isSubmitting = false;
		}
	}

	// Función para calcular IMC
	function calcularIMC(peso: number, altura: number) {
		if (!peso || !altura) return;

		// Convertir altura a metros si viene en cm
		const alturaMetros = altura > 3 ? altura / 100 : altura;
		const imcValue = peso / (alturaMetros * alturaMetros);

		let categoria = '';
		if (imcValue < 18.5) categoria = 'Bajo peso';
		else if (imcValue < 25) categoria = 'Normal';
		else if (imcValue < 30) categoria = 'Sobrepeso';
		else categoria = 'Obesidad';

		imc = imcValue.toFixed(2);
		categoriaPeso = categoria;
	}

	// Reactivos para calcular IMC automáticamente
	$: if ($form.peso && $form.altura) {
		calcularIMC(parseFloat($form.peso), parseFloat($form.altura));
	}

	// Función para validar rangos
	function validateRange(value: string | number, min: number, max: number): boolean {
		if (value === null || value === undefined || value === '') return true;
		const num = typeof value === 'number' ? value : parseFloat(String(value));
		if (isNaN(num)) return false;
		return num >= min && num <= max;
	}

	// Determinar si mostrar advertencia de rango
	function getRangeWarning(field: string, value: string | number): string {
		if (value === null || value === undefined || value === '') return '';
		const num = typeof value === 'number' ? value : parseFloat(String(value));

		const ranges: Record<string, { min: number; max: number; unit: string }> = {
			peso: { min: 1, max: 300, unit: 'kg' },
			altura: { min: 30, max: 250, unit: 'cm' },
			brazos: { min: 1, max: 200, unit: 'cm' },
			pantorrillas: { min: 1, max: 200, unit: 'cm' },
			gluteo: { min: 1, max: 200, unit: 'cm' },
			muslos: { min: 1, max: 200, unit: 'cm' },
			pecho: { min: 1, max: 200, unit: 'cm' },
			cintura: { min: 1, max: 200, unit: 'cm' },
			cuello: { min: 1, max: 100, unit: 'cm' }
		};

		const range = ranges[field];
		if (!range) return '';

		if (isNaN(num) || num < range.min || num > range.max) {
			return `Debe estar entre ${range.min} y ${range.max} ${range.unit}`;
		}

		return '';
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
						label="Brazos"
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
						label="Pantorrillas"
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
						label="Glúteo"
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
						label="Muslos"
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
						label="Pecho"
						type="number"
						placeholder="Ej. 55.5"
						unit="cm"
						min={1}
						max={200}
						bind:value={$form.pecho}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="cintura"
						label="Cintura"
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
