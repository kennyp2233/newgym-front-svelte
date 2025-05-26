<!-- src/routes/clientes/[id]/EditarMedidaModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { medidaService, type Medida } from '../../../../medidas/api';
	import type { Cliente } from '../../../api';
	import { TipoOcupacion } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	import * as yup from 'yup';

	export let isOpen = false;
	export let cliente: Cliente;
	export let medida: Medida;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	let isSubmitting = false;
	let imc = '';
	let categoriaPeso = '';

	const esNino = cliente.ocupacion === TipoOcupacion.NINO;

	// Esquema de validación
	const validationSchema = yup.object({
		peso: yup.number().required('El peso es requerido'),
		altura: yup.number().required('La altura es requerida'),
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

	// Configuración del formulario con valores iniciales de la medida
	const { form, errors, touched, handleSubmit } = createForm({
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
		validationSchema,
		onSubmit: async (values) => {
			isSubmitting = true;
			try {
				const medidaData = {
					peso: parseFloat(values.peso),
					altura: parseFloat(values.altura),
					imc: parseFloat(imc),
					categoriaPeso,
					...(esNino
						? {}
						: {
								brazos: parseFloat(values.brazos),
								pantorrillas: parseFloat(values.pantorrillas),
								gluteo: parseFloat(values.gluteo),
								muslos: parseFloat(values.muslos),
								pecho: parseFloat(values.pecho),
								cintura: parseFloat(values.cintura),
								cuello: values.cuello ? parseFloat(values.cuello) : undefined
							})
				};

				await medidaService.updateMedida(medida.idMedida, medidaData);
				toasts.showToast('Medida actualizada correctamente', 'success');
				onSuccess();
			} catch (error) {
				console.error('Error al actualizar medida:', error);
				toasts.showToast('Error al actualizar medida', 'error');
			} finally {
				isSubmitting = false;
			}
		}
	});

	// Función para calcular IMC
	function calcularIMC(peso: number, altura: number) {
		if (!peso || !altura) {
			imc = '';
			categoriaPeso = '';
			return;
		}

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

	// Inicializar IMC con valores de la medida existente
	$: if (medida && medida.peso && medida.altura) {
		calcularIMC(medida.peso, medida.altura);
	}

	// Reactivos para recalcular IMC cuando cambien los valores
	$: if ($form.peso && $form.altura) {
		calcularIMC(parseFloat($form.peso), parseFloat($form.altura));
	}
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">Editar medida</h3>
	</svelte:fragment>

	<form on:submit={handleSubmit}>
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
						label="Brazos"
						type="number"
						placeholder="Ej. 30"
						unit="cm"
						bind:value={$form.brazos}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="pantorrillas"
						label="Pantorrillas"
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
						label="Glúteo"
						type="number"
						placeholder="Ej. 95"
						unit="cm"
						bind:value={$form.gluteo}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="muslos"
						label="Muslos"
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
						label="Pecho"
						type="number"
						placeholder="Ej. 90"
						unit="cm"
						bind:value={$form.pecho}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="cintura"
						label="Cintura"
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

	<svelte:fragment slot="footer">
		<Button variant="outline" on:click={onClose} type="button">Cancelar</Button>
		<Button variant="primary" on:click={handleSubmit} type="button" isLoading={isSubmitting}>
			Actualizar medida
		</Button>
	</svelte:fragment>
</BaseModal>
