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

		// Emitir cambio de ocupación
		dispatch('updateField', { field: 'ocupacion', value: nuevaOcupacion });

		// La selección automática del plan se maneja en el componente padre
		// para mantener la lógica centralizada
	}

	function handleFieldChange(field: string) {
		return (e: Event) => {
			const target = e.target as HTMLInputElement | HTMLSelectElement;
			dispatch('updateField', { field, value: target.value });
		};
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

	// Helper para obtener el mensaje de ayuda del plan
	function getPlanHelperText(): string {
		if (planesFiltrados.length === 0) {
			return 'No hay planes disponibles para esta ocupación';
		}

		switch (formData.ocupacion) {
			case TipoOcupacion.NINO:
				return 'Solo está disponible el Plan de Niño para esta ocupación';
			case TipoOcupacion.ESTUDIANTE:
				return 'Solo está disponible el Plan de Estudiante para esta ocupación';
			default:
				return 'Seleccione un plan';
		}
	}
</script>

<div class="space-y-4">
	<FormRow>
		<FormField
			name="cedula"
			label="Cédula"
			placeholder="Ej: 0401010101"
			value={formData.cedula || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('cedula')}
		/>
		<FormField
			name="celular"
			label="Celular"
			placeholder="Ej: 0999999999"
			value={formData.celular || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('celular')}
		/>
	</FormRow>

	<FormRow>
		<FormField
			name="nombre"
			label="Nombres"
			placeholder="Ej: Kevin Mateo"
			value={formData.nombre || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('nombre')}
		/>
		<FormField
			name="apellido"
			label="Apellidos"
			placeholder="Ej: Cano Cruceñira"
			value={formData.apellido || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('apellido')}
		/>
	</FormRow>

	<FormRow>
		<FormField
			name="ciudad"
			label="Ciudad"
			placeholder="Ej: Tulcán"
			value={formData.ciudad || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('ciudad')}
		/>
		<FormField
			name="pais"
			label="País"
			placeholder="Ej: Ecuador"
			value={formData.pais || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('pais')}
		/>
	</FormRow>

	<FormRow>
		<FormField
			name="direccion"
			label="Dirección"
			placeholder="Ej: Calle 1, Casa 2"
			value={formData.direccion || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('direccion')}
		/>
		<div class="space-y-1.5">
			<FormField
				name="fechaNacimiento"
				label="Fecha de Nacimiento"
				type="date"
				maxDate={new Date()}
				value={formData.fechaNacimiento || ''}
				{errors}
				{touched}
				on:change={handleFieldChange('fechaNacimiento')}
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
			value={formData.correo || ''}
			{errors}
			{touched}
			on:input={handleFieldChange('correo')}
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
			value={formData.ocupacion || TipoOcupacion.ESTUDIANTE}
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
			value={formData.idPlan || ''}
			{errors}
			{touched}
			helperText={getPlanHelperText()}
			on:change={handleFieldChange('idPlan')}
		/>
		<FormField
			name="puestoTrabajo"
			label="Puesto de trabajo"
			placeholder="Ej: Albañil"
			disabled={formData.ocupacion !== TipoOcupacion.TRABAJO}
			value={formData.puestoTrabajo || ''}
			{errors}
			{touched}
			helperText={formData.ocupacion !== TipoOcupacion.TRABAJO
				? 'No aplica para esta ocupación'
				: ''}
			on:input={handleFieldChange('puestoTrabajo')}
		/>
	</FormRow>
</div>
