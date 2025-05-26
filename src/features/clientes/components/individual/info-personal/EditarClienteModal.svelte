<!-- src/routes/clientes/[id]/EditarClienteModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import { clienteService, type Cliente, TipoOcupacion } from '../../../api';
	import { planService, type Plan } from '../../../../planes/api';
	import { toasts } from '$lib/stores/toastStore';
	import { onMount } from 'svelte';
	import * as yup from 'yup';

	export let isOpen = false;
	export let cliente: Cliente;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	let planes: Plan[] = [];
	let isSubmitting = false;

	// Esquema de validación
	const validationSchema = yup.object({
		nombre: yup.string().required('El nombre es requerido'),
		apellido: yup.string().required('El apellido es requerido'),
		cedula: yup.string().required('La cédula es requerida'),
		celular: yup.string().required('El celular es requerido'),
		ciudad: yup.string().required('La ciudad es requerida'),
		pais: yup.string().required('El país es requerido'),
		direccion: yup.string().required('La dirección es requerida'),
		correo: yup.string().email('Correo inválido').required('El correo es requerido'),
		ocupacion: yup.string().required('La ocupación es requerida'),
		puestoTrabajo: yup.string().when('ocupacion', {
			is: TipoOcupacion.TRABAJO,
			then: (schema) => schema.required('El puesto de trabajo es requerido'),
			otherwise: (schema) => schema.notRequired()
		}),
		fechaNacimiento: yup.string().nullable()
	});	// Configuración del formulario (sin validationSchema para manejar validación manual)
	const { form, errors, touched, updateField } = createForm({
		initialValues: {
			nombre: cliente.nombre,
			apellido: cliente.apellido,
			cedula: cliente.cedula,
			celular: cliente.celular,
			ciudad: cliente.ciudad,
			pais: cliente.pais,
			direccion: cliente.direccion,
			correo: cliente.correo,
			ocupacion: cliente.ocupacion,
			puestoTrabajo: cliente.puestoTrabajo || '',
			fechaNacimiento: cliente.fechaNacimiento || ''
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
			await clienteService.updateCliente(cliente.idCliente, {
				nombre: $form.nombre,
				apellido: $form.apellido,
				cedula: $form.cedula,
				celular: $form.celular,
				direccion: $form.direccion,
				ciudad: $form.ciudad,
				pais: $form.pais,
				correo: $form.correo,
				ocupacion: $form.ocupacion as TipoOcupacion,
				puestoTrabajo:
					$form.ocupacion === TipoOcupacion.TRABAJO ? $form.puestoTrabajo : undefined,
				fechaNacimiento: $form.fechaNacimiento || undefined
			});

			toasts.showToast('Cliente actualizado correctamente', 'success');
			onSuccess();
		} catch (error: any) {
			console.error('Error al actualizar cliente:', error);
			const errorMessage = error.response?.data?.message || 'Error al actualizar cliente';
			toasts.showToast(errorMessage, 'error');
		} finally {
			isSubmitting = false;
		}
	}

	// Cargar planes
	onMount(async () => {
		try {
			planes = await planService.getPlanes();
		} catch (error) {
			console.error('Error al cargar planes:', error);
		}
	});

	// Filtrar planes según ocupación
	function filtrarPlanesPorOcupacion(ocupacion: TipoOcupacion) {
		if (!planes || planes.length === 0) return [];

		if (ocupacion === TipoOcupacion.NINO) {
			return planes.filter((plan) => plan.tag === 'Niño');
		} else if (ocupacion === TipoOcupacion.ESTUDIANTE) {
			return planes.filter((plan) => plan.tag === 'Estudiante');
		} else {
			return planes.filter((plan) => plan.tag === 'Trabajo');
		}
	}

	// Calcular edad
	function calcularEdad(fecha: string): number {
		if (!fecha) return 0;
		const nacimiento = new Date(fecha);
		const hoy = new Date();
		let edad = hoy.getFullYear() - nacimiento.getFullYear();
		const mes = hoy.getMonth() - nacimiento.getMonth();
		if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
			edad--;
		}
		return edad;
	}

	$: planesFiltrados = filtrarPlanesPorOcupacion($form.ocupacion as TipoOcupacion);
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">Editar Información del Cliente</h3>
	</svelte:fragment>
	<form on:submit|preventDefault={handleSubmitForm}>
		<div class="space-y-4">
			<p class="mb-4 text-sm text-gray-600">
				Editar información personal de <strong>{cliente.nombre} {cliente.apellido}</strong>
			</p>			<FormRow>
				<FormField
					name="cedula"
					label="Cédula"
					placeholder="Ej: 0401010101"
					bind:value={$form.cedula}
					errors={$errors}
					touched={$touched}
				/>
				<FormField
					name="celular"
					label="Celular"
					placeholder="Ej: 0999999999"
					bind:value={$form.celular}
					errors={$errors}
					touched={$touched}
				/>
			</FormRow>

			<FormRow>
				<FormField
					name="nombre"
					label="Nombres"
					placeholder="Ej: Kevin Mateo"
					bind:value={$form.nombre}
					errors={$errors}
					touched={$touched}
				/>
				<FormField
					name="apellido"
					label="Apellidos"
					placeholder="Ej: Cano Cruceñira"
					bind:value={$form.apellido}
					errors={$errors}
					touched={$touched}
				/>
			</FormRow>

			<FormRow>
				<FormField
					name="ciudad"
					label="Ciudad"
					placeholder="Ej: Tulcán"
					bind:value={$form.ciudad}
					errors={$errors}
					touched={$touched}
				/>
				<FormField
					name="pais"
					label="País"
					placeholder="Ej: Ecuador"
					bind:value={$form.pais}
					errors={$errors}
					touched={$touched}
				/>
			</FormRow>

			<FormRow>
				<FormField
					name="direccion"
					label="Dirección"
					placeholder="Ej: Calle 1, Casa 2"
					bind:value={$form.direccion}
					errors={$errors}
					touched={$touched}
				/>
				<div class="space-y-1.5">
					<DatePicker
						name="fechaNacimiento"
						label="Fecha de Nacimiento"
						placeholder="Seleccione fecha"
						maxDate={new Date()}
						bind:value={$form.fechaNacimiento}
						error={$touched.fechaNacimiento && !!$errors.fechaNacimiento}
						errorMessage={$errors.fechaNacimiento}
					/>
					{#if $form.fechaNacimiento}
						<p class="text-sm text-gray-500">
							El cliente tiene {calcularEdad($form.fechaNacimiento)} años
						</p>
					{/if}
				</div>
			</FormRow>

			<FormRow>
				<FormField
					name="correo"
					label="Correo Electrónico"
					placeholder="Ej: nombre@gmail.com"
					bind:value={$form.correo}
					errors={$errors}
					touched={$touched}
				/>
				<FormField
					name="ocupacion"
					label="Ocupación"
					type="select"
					options={[
						{ value: TipoOcupacion.TRABAJO, label: 'Trabajo' },
						{ value: TipoOcupacion.ESTUDIANTE, label: 'Estudiante' },
						{ value: TipoOcupacion.NINO, label: 'Niño' }
					]}
					bind:value={$form.ocupacion}
					errors={$errors}
					touched={$touched}					on:change={(e) => {
						// Limpiar puesto de trabajo si no es Trabajo
						if (e.target && (e.target as HTMLSelectElement).value !== TipoOcupacion.TRABAJO) {
							updateFieldWrapper('puestoTrabajo', '');
						}
					}}
				/>
			</FormRow>

			<FormRow>
				<FormField
					name="puestoTrabajo"
					label="Puesto de trabajo"
					placeholder="Ej: Albañil"
					disabled={$form.ocupacion !== TipoOcupacion.TRABAJO}
					bind:value={$form.puestoTrabajo}
					errors={$errors}
					touched={$touched}
					helperText={$form.ocupacion !== TipoOcupacion.TRABAJO
						? 'No aplica para esta ocupación'
						: ''}
				/>
				<div></div>
			</FormRow>

			<!-- Información sobre planes disponibles -->
			<div class="rounded-md border border-blue-200 bg-blue-50 p-4">
				<h4 class="mb-2 font-medium text-blue-800">Planes disponibles para esta ocupación:</h4>
				{#if planesFiltrados.length > 0}
					<ul class="space-y-1 text-sm text-blue-700">
						{#each planesFiltrados as plan}
							<li>
								• {plan.nombre} - ${plan.precio.toFixed(2)} ({plan.duracionMeses}
								{plan.duracionMeses === 1 ? 'mes' : 'meses'})
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-blue-700">No hay planes disponibles para esta ocupación.</p>
				{/if}
			</div>

			<div class="rounded-md border border-yellow-200 bg-yellow-50 p-4">
				<p class="text-sm text-yellow-700">
					<strong>Nota:</strong> Para cambiar el plan o registrar nuevas medidas, utiliza las opciones
					correspondientes en la ficha del cliente después de guardar estos cambios.
				</p>
			</div>
		</div>
	</form>
	<svelte:fragment slot="footer">
		<Button variant="outline" on:click={onClose} type="button">Cancelar</Button>
		<Button variant="primary" on:click={handleSubmitForm} type="button" isLoading={isSubmitting}>
			Actualizar Cliente
		</Button>
	</svelte:fragment>
</BaseModal>
