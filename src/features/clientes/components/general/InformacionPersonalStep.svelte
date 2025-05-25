<!-- src/features/clientes/components/general/InformacionPersonalStep.svelte -->
<script lang="ts">
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { TipoOcupacion } from '../../api';
	import type { Plan } from '../../../planes/api';
	import { createEventDispatcher } from 'svelte';

	export let formData: any;
	export let errors: any;
	export let touched: any;
	export let planes: Plan[] = [];

	const dispatch = createEventDispatcher();

	// Filtrar planes según ocupación
	$: planesFiltrados = filterPlanesPorOcupacion(formData.ocupacion || TipoOcupacion.ESTUDIANTE);

	function filterPlanesPorOcupacion(ocupacion: string) {
		if (!planes || planes.length === 0) return [];

		if (ocupacion === TipoOcupacion.NINO) {
			return planes.filter((plan) => plan.tag === 'Niño');
		} else if (ocupacion === TipoOcupacion.ESTUDIANTE) {
			return planes.filter((plan) => plan.tag === 'Estudiante');
		} else {
			return planes.filter((plan) => plan.tag === 'Trabajo');
		}
	}

	function handleOcupacionChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		const nuevaOcupacion = target.value;

		dispatch('updateField', { field: 'ocupacion', value: nuevaOcupacion });

		// Actualizar plan automáticamente
		const planesFiltrados = filterPlanesPorOcupacion(nuevaOcupacion);
		if (planesFiltrados.length > 0) {
			dispatch('updateField', { field: 'idPlan', value: planesFiltrados[0].idPlan.toString() });
		}

		// Limpiar puesto de trabajo si no es Trabajo
		if (nuevaOcupacion !== TipoOcupacion.TRABAJO) {
			dispatch('updateField', { field: 'puestoTrabajo', value: '' });
		}
	}

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
</script>

<div class="space-y-4">
	<FormRow>
		<FormField
			name="cedula"
			label="Cédula"
			placeholder="Ej: 0401010101"
			bind:value={formData.cedula}
			{errors}
			{touched}
		/>
		<FormField
			name="celular"
			label="Celular"
			placeholder="Ej: 0999999999"
			bind:value={formData.celular}
			{errors}
			{touched}
		/>
	</FormRow>

	<FormRow>
		<FormField
			name="nombre"
			label="Nombres"
			placeholder="Ej: Kevin Mateo"
			bind:value={formData.nombre}
			{errors}
			{touched}
		/>
		<FormField
			name="apellido"
			label="Apellidos"
			placeholder="Ej: Cano Cruceñira"
			bind:value={formData.apellido}
			{errors}
			{touched}
		/>
	</FormRow>

	<FormRow>
		<FormField
			name="ciudad"
			label="Ciudad"
			placeholder="Ej: Tulcán"
			bind:value={formData.ciudad}
			{errors}
			{touched}
		/>
		<FormField
			name="pais"
			label="País"
			placeholder="Ej: Ecuador"
			bind:value={formData.pais}
			{errors}
			{touched}
		/>
	</FormRow>

	<FormRow>
		<FormField
			name="direccion"
			label="Dirección"
			placeholder="Ej: Calle 1, Casa 2"
			bind:value={formData.direccion}
			{errors}
			{touched}
		/>
		<div class="space-y-1.5">
			<FormField
				name="fechaNacimiento"
				label="Fecha de Nacimiento"
				type="date"
				maxDate={new Date()}
				bind:value={formData.fechaNacimiento}
				{errors}
				{touched}
			/>
			{#if formData.fechaNacimiento}
				<p class="text-sm text-gray-500">
					El cliente tiene {calcularEdad(formData.fechaNacimiento)} años
				</p>
			{/if}
		</div>
	</FormRow>

	<FormRow>
		<FormField
			name="correo"
			label="Correo Electrónico"
			type="email"
			placeholder="Ej: nombre@gmail.com"
			bind:value={formData.correo}
			{errors}
			{touched}
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
			bind:value={formData.ocupacion}
			{errors}
			{touched}
			on:change={handleOcupacionChange}
		/>
	</FormRow>

	<FormRow>
		<FormField
			name="idPlan"
			label="Plan"
			type="select"
			options={[
				{ value: '', label: 'Seleccionar plan' },
				...planesFiltrados.map((plan) => ({
					value: plan.idPlan.toString(),
					label: `${plan.nombre} (${plan.duracionMeses} ${plan.duracionMeses === 1 ? 'mes' : 'meses'}) - $${plan.precio}`
				}))
			]}
			bind:value={formData.idPlan}
			{errors}
			{touched}
			helperText={planesFiltrados.length === 0
				? 'No hay planes disponibles para esta ocupación'
				: formData.ocupacion === TipoOcupacion.NINO
					? 'Solo está disponible el Plan de Niño para esta ocupación'
					: formData.ocupacion === TipoOcupacion.ESTUDIANTE
						? 'Solo está disponible el Plan de Estudiante para esta ocupación'
						: 'Seleccione un plan'}
		/>
		<FormField
			name="puestoTrabajo"
			label="Puesto de trabajo"
			placeholder="Ej: Albañil"
			disabled={formData.ocupacion !== TipoOcupacion.TRABAJO}
			bind:value={formData.puestoTrabajo}
			{errors}
			{touched}
			helperText={formData.ocupacion !== TipoOcupacion.TRABAJO
				? 'No aplica para esta ocupación'
				: ''}
		/>
	</FormRow>
</div>
