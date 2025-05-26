<!-- src/features/clientes/components/individual/pagos/NuevoPagoModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import { onMount } from 'svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import FormRow from '$lib/components/ui/forms/FormRow.svelte';
	import { pagoService, type RenovacionPlanDTO } from '../../../../pagos/api';
	import { planService, type Plan } from '../../../../planes/api';
	import type { Cliente } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	import * as yup from 'yup';

	export let isOpen = false;
	export let cliente: Cliente;
	export let planActualId: number | undefined = undefined;
	export let isRenovacion = false;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	let planes: Plan[] = [];
	let planSeleccionado: Plan | null = null;
	let tieneDeudaActiva = false;
	let isSubmitting = false;
	let puedeRenovar = { puede: true, mensaje: '', diasRestantes: 0 as number | undefined } as { puede: boolean; mensaje: string; diasRestantes?: number | undefined };

	// Esquema de validación actualizado según documentación
	const validationSchema = yup.object({
		idPlan: yup.string().required('Debe seleccionar un plan'),
		metodoPago: yup.string().nullable(),
		monto: yup
			.number()
			.nullable()
			.min(1, 'El monto debe ser mayor a $1.00')
			.test('decimal-places', 'Solo se permiten hasta 2 decimales', (value) => {
				if (!value) return true;
				const decimal = value.toString().split('.')[1];
				return !decimal || decimal.length <= 2;
			})
			.test(
				'max-amount',
				'El monto no puede exceder el precio del plan + renovación',
				function (value) {
					const { idPlan } = this.parent;
					if (!value || !idPlan) return true;
					const plan = planes.find((p) => p.idPlan === parseInt(idPlan));
					const precioTotal = plan ? plan.precio + 10 : 0; // +$10 renovación según documentación
					return value <= precioTotal;
				}
			),
		fechaInicio: yup.string().nullable(),
		referencia: yup.string().nullable(),
		observaciones: yup
			.string()
			.max(150, 'Las observaciones no pueden exceder 150 caracteres')
			.nullable()
	});

	// Configuración del formulario
	const { form, errors, touched, handleSubmit } = createForm({
		initialValues: {
			idPlan: planActualId?.toString() || '',
			metodoPago: '',
			monto: '',
			fechaInicio: new Date().toISOString().split('T')[0],
			referencia: '',
			observaciones: ''
		},
		validationSchema,
		onSubmit: async (values) => {
			// Verificar si tiene deuda activa
			if (tieneDeudaActiva) {
				toasts.showToast(
					'No se puede registrar un nuevo pago mientras haya deuda pendiente. Complete el pago anterior primero.',
					'error'
				);
				return;
			}

			// Verificar si puede renovar (solo para renovaciones)
			if (isRenovacion && !puedeRenovar.puede) {
				toasts.showToast(puedeRenovar.mensaje, 'error');
				return;
			}

			isSubmitting = true;
			try {
				// Preparar datos según documentación API
				const renovacionData: RenovacionPlanDTO = {
					idCliente: cliente.idCliente,
					idPlan: parseInt(values.idPlan),
					metodoPago: (values.metodoPago as 'Efectivo' | 'Transferencia' | 'Tarjeta') || undefined,
					monto: values.monto ? parseFloat(values.monto.toString()) : undefined,
					fechaInicio: values.fechaInicio || undefined,
					referencia: values.referencia || undefined,
					observaciones: values.observaciones || undefined
				};

				const response = await pagoService.renovarPlan(renovacionData);

				// Mostrar mensaje de éxito según la documentación
				if (response.datos.pago.estado === 'Completado') {
					toasts.showToast(
						isRenovacion ? 'Plan renovado correctamente' : 'Pago registrado correctamente',
						'success'
					);
				} else {
					toasts.showToast(
						isRenovacion ? 'Renovación registrada con pago parcial' : 'Pago parcial registrado',
						'info'
					);
				}

				onSuccess();
			} catch (error: any) {
				console.error('Error al procesar pago:', error);
				const errorMessage = error.message || 'Error al procesar pago';
				toasts.showToast(errorMessage, 'error');
			} finally {
				isSubmitting = false;
			}
		}
	});

	// Cargar datos iniciales
	onMount(async () => {
		try {
			const planesData = await planService.getPlanes();
			planes = planesData;

			// Si hay un plan actual, seleccionarlo por defecto
			if (planActualId) {
				const plan = planesData.find((p) => p.idPlan === planActualId);
				planSeleccionado = plan || null;
			}

			// Verificar si tiene deuda activa
			tieneDeudaActiva = await pagoService.clienteTieneDeudaPendiente(cliente.idCliente);

			// Verificar si puede renovar (solo para renovaciones)
			if (isRenovacion) {
				puedeRenovar = await pagoService.puedeRenovarPlan(cliente.idCliente);
			}
		} catch (error) {
			console.error('Error al cargar datos:', error);
			toasts.showToast('Error al cargar información', 'error');
		}
	});

	// Calcular año de renovación según documentación
	function calcularAñoRenovacion(): number {
		if (!cliente.inscripciones || cliente.inscripciones.length === 0) {
			return new Date().getFullYear();
		}

		const primeraInscripcion = cliente.inscripciones.sort(
			(a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
		)[0];

		const fechaInicial = new Date(primeraInscripcion.fechaInicio);
		const añoActual = new Date().getFullYear();
		const añoInicial = fechaInicial.getFullYear();

		return añoInicial + (añoActual - añoInicial) + 1;
	}

	// Actualizar plan seleccionado cuando cambia el idPlan
	function handlePlanChange(idPlan: string) {
		const plan = planes.find((p) => p.idPlan === parseInt(idPlan));
		planSeleccionado = plan || null;
	}

	// Calcular fecha de fin
	function calcularFechaFin(fechaInicio: string, duracionMeses: number): string {
		if (!fechaInicio) return '';
		const fecha = new Date(fechaInicio);
		fecha.setMonth(fecha.getMonth() + duracionMeses);
		return fecha.toISOString().split('T')[0];
	}

	// Calcular precio total con renovación anual según documentación
	function getPrecioTotal(): number {
		if (!planSeleccionado) return 10; // Solo renovación anual
		return planSeleccionado.precio + 10; // Precio del plan + renovación anual ($10)
	}

	$: añoRenovacion = calcularAñoRenovacion();
	$: caracteresRestantes = 150 - ($form.observaciones?.length || 0);
	$: precioTotal = getPrecioTotal();

	// Reactivo: actualizar plan seleccionado cuando cambie idPlan en el form
	$: if ($form.idPlan) {
		handlePlanChange($form.idPlan);
	}
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">
			{isRenovacion ? 'Renovar Plan' : 'Nuevo Pago'}
		</h3>
	</svelte:fragment>

	{#if tieneDeudaActiva}
		<div class="p-6 text-center">
			<div class="mb-4 rounded-md border border-yellow-300 bg-yellow-100 p-4">
				<h3 class="mb-2 font-bold text-yellow-800">⚠️ Deuda Activa Detectada</h3>
				<p class="text-yellow-700">
					Este cliente tiene un pago pendiente. Debe completar el pago anterior antes de registrar
					uno nuevo.
				</p>
			</div>
		</div>
	{:else if isRenovacion && !puedeRenovar.puede}
		<div class="p-6 text-center">
			<div class="mb-4 rounded-md border border-red-300 bg-red-100 p-4">
				<h3 class="mb-2 font-bold text-red-800">❌ Renovación No Permitida</h3>
				<p class="text-red-700">{puedeRenovar.mensaje}</p>
				{#if puedeRenovar.diasRestantes && puedeRenovar.diasRestantes > 5}
					<p class="mt-2 text-sm text-red-600">
						Podrás renovar cuando falten 5 días o menos para el vencimiento.
					</p>
				{/if}
			</div>
		</div>
	{:else}
		<form on:submit={handleSubmit}>
			<div class="space-y-4">
				<p class="mb-4 text-sm text-gray-600">
					{isRenovacion ? 'Renovar membresía para' : 'Registrar nuevo pago para'}
					<strong>{cliente.nombre} {cliente.apellido}</strong>
				</p>

				<!-- Información de renovación anual según documentación -->
				<div class="rounded-md border border-blue-200 bg-blue-50 p-4">
					<h4 class="mb-2 font-bold text-blue-800">💰 Renovación Anual {añoRenovacion}</h4>
					<p class="text-sm text-blue-700">
						Se incluye automáticamente un cargo de <strong>$10.00</strong> por renovación anual para
						mantenimiento de máquinas (año {añoRenovacion}).
					</p>
				</div>

				{#if isRenovacion && puedeRenovar.diasRestantes !== undefined}
					<div class="rounded-md border border-green-200 bg-green-50 p-4">
						<h4 class="mb-2 font-bold text-green-800">✅ Renovación Permitida</h4>
						<p class="text-sm text-green-700">
							La membresía actual vence en <strong>{puedeRenovar.diasRestantes}</strong> días. Puedes
							proceder con la renovación.
						</p>
					</div>
				{/if}

				<FormRow>
					<FormField
						name="idPlan"
						label="Plan"
						type="select"
						options={[
							{ value: '', label: 'Seleccionar plan' },
							...planes.map((plan) => ({
								value: plan.idPlan.toString(),
								label: `${plan.nombre} (${plan.duracionMeses} ${
									plan.duracionMeses === 1 ? 'mes' : 'meses'
								}) - $${plan.precio.toFixed(2)}`
							}))
						]}
						bind:value={$form.idPlan}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="metodoPago"
						label="Método de pago (Opcional)"
						type="select"
						options={[
							{ value: '', label: 'No especificar' },
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
						name="monto"
						label="Monto a pagar (Opcional)"
						type="number"
						placeholder={precioTotal.toFixed(2)}
						helperText={planSeleccionado
							? `Plan: $${planSeleccionado.precio.toFixed(2)} + Renovación: $10.00 = Total: $${precioTotal.toFixed(2)}. Si no especificas monto, se tomará el precio completo.`
							: 'Seleccione un plan para ver el precio total'}
						unit="$"
						min={1}
						max={precioTotal}
						step="0.01"
						bind:value={$form.monto}
						errors={$errors}
						touched={$touched}
					/>
					<FormField
						name="fechaInicio"
						label="Fecha de inicio (Opcional)"
						type="date"
						helperText="Si no se especifica, se usará la fecha actual"
						bind:value={$form.fechaInicio}
						errors={$errors}
						touched={$touched}
					/>
				</FormRow>

				{#if $form.metodoPago === 'Transferencia'}
					<FormRow>
						<FormField
							name="referencia"
							label="Referencia de transferencia"
							placeholder="Ej: TRF-123456"
							bind:value={$form.referencia}
							errors={$errors}
							touched={$touched}
						/>
						<div></div>
					</FormRow>
				{/if}

				<div class="w-full space-y-1.5">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="text-md font-bold text-[var(--letter)]">Observaciones (Opcional)</label>
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

				<!-- Resumen del pago -->
				{#if planSeleccionado && $form.fechaInicio}
					<div class="mt-6 rounded-md bg-gray-50 p-4">
						<h3 class="mb-2 font-semibold">
							Resumen del {isRenovacion ? 'renovación' : 'pago'}:
						</h3>
						<div class="space-y-1 text-sm text-gray-600">
							<p>Plan: {planSeleccionado.nombre}</p>
							<p>
								Duración: {planSeleccionado.duracionMeses}
								{planSeleccionado.duracionMeses === 1 ? 'mes' : 'meses'}
							</p>
							<div class="mt-2 border-t pt-2">
								<p>Precio del plan: ${planSeleccionado.precio.toFixed(2)}</p>
								<p>Renovación anual {añoRenovacion}: $10.00</p>
								<p class="font-bold">Total: ${precioTotal.toFixed(2)}</p>
								<p>Monto a pagar: ${$form.monto || precioTotal.toFixed(2)}</p>
								{#if !$form.monto}
									<p class="text-xs text-blue-600">
										(Se tomará el precio completo automáticamente)
									</p>
								{:else if parseFloat($form.monto.toString()) < precioTotal}
									<p class="font-medium text-yellow-600">
										Restante: ${(precioTotal - parseFloat($form.monto.toString())).toFixed(2)}
										(Pago será marcado como Pendiente)
									</p>
								{/if}
							</div>
							<p>Fecha de inicio: {$form.fechaInicio}</p>
							<p>
								Fecha de fin: {calcularFechaFin($form.fechaInicio, planSeleccionado.duracionMeses)}
							</p>
						</div>
					</div>
				{/if}
			</div>
		</form>
	{/if}

	<svelte:fragment slot="footer">
		{#if tieneDeudaActiva || (isRenovacion && !puedeRenovar.puede)}
			<Button variant="primary" on:click={onClose}>Entendido</Button>
		{:else}
			<Button variant="outline" on:click={onClose} type="button">Cancelar</Button>
			<Button variant="primary" on:click={handleSubmit} type="button" isLoading={isSubmitting}>
				{isRenovacion ? 'Renovar Plan' : 'Registrar Pago'}
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
