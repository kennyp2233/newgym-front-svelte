<script lang="ts">
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { TipoOcupacion } from '../../api';
	import type { Plan } from '../../../planes/api';

	export let data: any;
	export let errors: any;
	export let touched: any;
	export let planes: Plan[] = [];
	export let updateField: ((field: string, value: any) => void) | undefined = undefined;

	// Filtrar planes según ocupación
	$: planesFiltrados = filterPlanesPorOcupacion(data.ocupacion || TipoOcupacion.ESTUDIANTE);

	function filterPlanesPorOcupacion(ocupacion: string) {
		if (!planes || planes.length === 0) return [];

		if (ocupacion === TipoOcupacion.NINO) {
			return planes.filter((plan) => plan.tag === TipoOcupacion.NINO);
		} else if (ocupacion === TipoOcupacion.ESTUDIANTE) {
			return planes.filter((plan) => plan.tag === TipoOcupacion.ESTUDIANTE);
		} else {
			return planes.filter((plan) => plan.tag === 'Trabajo');
		}
	}
	// Selección automática de plan cuando cambia ocupación
	let lastOcupacion = data.ocupacion;
	$: if (data.ocupacion && data.ocupacion !== lastOcupacion && planesFiltrados.length > 0 && updateField) {
		lastOcupacion = data.ocupacion;
		const newPlanId = planesFiltrados[0].idPlan.toString();
		updateField('idPlan', newPlanId);
	}
	// Limpiar puesto de trabajo si no es ocupación de trabajo
	let lastOcupacionForJob = data.ocupacion;
	$: if (data.ocupacion !== lastOcupacionForJob && updateField) {
		lastOcupacionForJob = data.ocupacion;
		if (data.ocupacion !== TipoOcupacion.TRABAJO && data.puestoTrabajo) {
			updateField('puestoTrabajo', '');
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

	function getPlanHelperText(): string {
		if (planesFiltrados.length === 0) {
			return 'No hay planes disponibles para esta ocupación';
		}

		switch (data.ocupacion) {
			case TipoOcupacion.NINO:
				return 'Solo está disponible el Plan de Niño para esta ocupación';
			case TipoOcupacion.ESTUDIANTE:
				return 'Solo está disponible el Plan de Estudiante para esta ocupación';
			default:
				return 'Seleccione un plan';
		}
	}
</script>

<div class="space-y-4">	<FormRow>
		<FormField
			name="cedula"
			label="Cédula"
			placeholder="Ej: 0401010101"
			bind:value={data.cedula}
			{errors}
			{touched}
		/>
		<FormField
			name="celular"
			label="Celular"
			placeholder="Ej: 0999999999"
			bind:value={data.celular}
			{errors}
			{touched}
		/>
	</FormRow>

	<FormRow>
		<FormField
			name="nombre"
			label="Nombres"
			placeholder="Ej: Kevin Mateo"
			bind:value={data.nombre}
			{errors}
			{touched}
		/>
		<FormField
			name="apellido"
			label="Apellidos"
			placeholder="Ej: Cano Cruceñira"
			bind:value={data.apellido}
			{errors}
			{touched}
		/>
	</FormRow>
	<FormRow>
		<FormField
			name="ciudad"
			label="Ciudad"
			placeholder="Ej: Tulcán"
			bind:value={data.ciudad}
			{errors}
			{touched}
		/>
		<FormField
			name="pais"
			label="País"
			placeholder="Ej: Ecuador"
			bind:value={data.pais}
			{errors}
			{touched}
		/>
	</FormRow>

	<FormRow>
		<FormField
			name="direccion"
			label="Dirección"
			placeholder="Ej: Calle 1, Casa 2"
			bind:value={data.direccion}
			{errors}
			{touched}
		/>
		<div class="space-y-1.5">
			<FormField
				name="fechaNacimiento"
				label="Fecha de Nacimiento"
				type="date"
				maxDate={new Date()}
				bind:value={data.fechaNacimiento}
				{errors}
				{touched}
			/>
			{#if data.fechaNacimiento}
				<p class="text-sm text-gray-500">
					El cliente tiene {calcularEdad(data.fechaNacimiento)} años
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
			bind:value={data.correo}
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
			bind:value={data.ocupacion}
			{errors}
			{touched}
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
			bind:value={data.idPlan}
			{errors}
			{touched}
			helperText={getPlanHelperText()}
		/>
		<FormField
			name="puestoTrabajo"
			label="Puesto de trabajo"
			placeholder="Ej: Albañil"
			bind:value={data.puestoTrabajo}
			{errors}
			{touched}
			disabled={data.ocupacion !== TipoOcupacion.TRABAJO}
		/>
	</FormRow>
</div>
