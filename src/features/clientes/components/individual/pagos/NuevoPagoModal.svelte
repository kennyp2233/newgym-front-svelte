<!-- src/features/clientes/components/individual/pagos/NuevoPagoModal.svelte -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import { onMount } from 'svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { pagoService, type RenovacionPlanDTO, type PagoDTO } from '../../../../pagos/api';
	import { planService, type Plan } from '../../../../planes/api';
	import type { Cliente } from '../../../api';
	import { toasts } from '$lib/stores/toastStore';
	import { calculateTotalPrice, shouldApplyAnnualFee } from '../../../forms/validation';
	
	// Importar componentes modulares de pagos
	import { createPagoStore, createRenovacionValidator, pagoUtils } from '../../../../pagos/composables/pagoComposables';
	import PagoFormFields from '../../../../pagos/forms/PagoFormFields.svelte';
	import { nuevoPagoValidationSchema } from '../../../../pagos/forms/validationSchemas';
	
	// Importar modular cuotas-mantenimiento
	import { createCuotaMantenimientoStore, cuotaMantenimientoUtils } from '../../../../cuotas-mantenimiento/composables/cuotaMantenimientoComposables';
	import CuotaAnualidadField from '../../../../cuotas-mantenimiento/components/CuotaAnualidadField.svelte';
	import { cuotaMantenimientoService } from '../../../../cuotas-mantenimiento/api';

	export let isOpen = false;
	export let cliente: Cliente;
	export let planActualId: number | undefined = undefined;
	export let isRenovacion = false;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};	// Estados usando composables
	const pagoStore = createPagoStore(cliente.idCliente);
	const renovacionValidator = createRenovacionValidator(cliente);
	const cuotaMantenimientoStore = createCuotaMantenimientoStore(cliente.idCliente);
	
	// Destructurar stores para acceso reactivo
	const { tieneDeudaActiva: pagoStoreState, pagos: pagosStore } = pagoStore;
	const { puedeRenovar: renovacionState } = renovacionValidator;
	const { cuotasPendientes, isLoading: cuotasLoading } = cuotaMantenimientoStore;
	
	let planes: Plan[] = [];
	let planSeleccionado: Plan | null = null;
	let isSubmitting = false;
	
	// Estados para cuotas de mantenimiento
	let incluyeAnualidad: boolean = false;
	let montoDesglose: { plan: number; anualidad: number; cuotasPendientes: number } | null = null;
	// Configuración del formulario usando esquema modular
	const { form, errors, touched, updateField } = createForm({
		initialValues: {
			idPlan: planActualId?.toString() || '',
			metodoPago: '',
			monto: '',
			fechaInicio: new Date().toISOString().split('T')[0],
			referencia: '',
			observaciones: ''
		},
		onSubmit: () => {} // Se manejará con handleSubmitForm
	});
	// Función de validación usando esquema modular
	async function validateForm(): Promise<boolean> {
		try {
			await nuevoPagoValidationSchema.validate($form, { abortEarly: false });
			// Limpiar errores si la validación pasa
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
			errors.set(newErrors);
			
			// Marcar campos como touched
			const newTouched: Record<string, boolean> = {};
			Object.keys($form).forEach((key) => (newTouched[key] = true));
			touched.set(newTouched as any);
			return false;
		}
	}	// Función de submit usando composable - ACTUALIZADO según documentación estricta
	async function handleSubmitForm() {
		const isValid = await validateForm();
		if (!isValid) {
			toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
			return;
		}
				// Verificar deuda activa usando composable
		if ($pagoStoreState) {
			toasts.showToast(
				'No se puede registrar un nuevo pago mientras haya deuda pendiente. Complete el pago anterior primero.',
				'error'
			);
			return;
		}

		// Verificar renovación usando composable
		if (isRenovacion && !$renovacionState.puede) {
			toasts.showToast($renovacionState.mensaje, 'error');
			return;
		}

		// CRÍTICO: Verificar cuotas pendientes usando endpoint específico según documentación
		if (isRenovacion) {
			try {
				const cuotasResponse = await cuotaMantenimientoService.tieneCuotasPendientes(cliente.idCliente);
				if (cuotasResponse.tienePendientes) {
					const totalCuotasPendientes = $cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
					const montoMinimo = (planSeleccionado?.precio || 0) + totalCuotasPendientes + (incluyeAnualidad ? 10 : 0);
					const montoIngresado = parseFloat($form.monto);

					if (montoIngresado < montoMinimo) {
						toasts.showToast(
							`Para renovar debe pagar un mínimo de $${montoMinimo.toFixed(2)} (plan + cuotas pendientes${incluyeAnualidad ? ' + anualidad' : ''})`,
							'error'
						);
						return;
					}
				}
			} catch (error) {
				console.error('Error al verificar cuotas pendientes:', error);
				toasts.showToast('Error al verificar cuotas pendientes', 'error');
				return;
			}		}

		isSubmitting = true;

		const exito = await pagoStore.crearPago({
			idCliente: cliente.idCliente,
			idPlan: parseInt($form.idPlan),
			metodoPago: ($form.metodoPago as 'Efectivo' | 'Transferencia' | 'Tarjeta') || undefined,
			monto: $form.monto ? parseFloat($form.monto.toString()) : undefined,
			fechaInicio: $form.fechaInicio || undefined,
			referencia: $form.referencia || undefined,
			observaciones: $form.observaciones || undefined,
			// Campos para cuotas de mantenimiento actualizados
			incluyeAnualidad: incluyeAnualidad,
			pagaCuotasPendientes: $cuotasPendientes.length > 0,
			cuotasPorPagar: $cuotasPendientes.length > 0 ? $cuotasPendientes.map(cuota => cuota.idCuota).filter((id): id is number => id !== undefined) : undefined
		});

		if (exito) {
			onSuccess();
		}
		isSubmitting = false;
	}// Cargar datos iniciales usando composables
	onMount(async () => {
		try {
			const planesData = await planService.getPlanes();
			planes = planesData;

			// Cargar datos usando composables
			await pagoStore.cargarPagos();
			await pagoStore.verificarDeudaActiva();
			
			if (isRenovacion) {
				await renovacionValidator.validarRenovacion();
			}			// Cargar cuotas de mantenimiento pendientes usando store modular
			await cuotaMantenimientoStore.cargarCuotas();

			// Si hay un plan actual, seleccionarlo por defecto
			if (planActualId) {
				const plan = planesData.find((p) => p.idPlan === planActualId);
				planSeleccionado = plan || null;
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
	}	// Calcular precio total con renovación anual usando utils - ACTUALIZADO para cuotas pendientes
	function getPrecioTotal(): number {
		if (!planSeleccionado) return 0;
		
		// Si hay desglose disponible, usar ese total
		if (montoDesglose) {
			return montoDesglose.plan + montoDesglose.anualidad + montoDesglose.cuotasPendientes;
		}
		
		// Cálculo manual para renovaciones con cuotas pendientes
		let total = planSeleccionado.precio;
		
		// Agregar anualidad si está seleccionada
		if (incluyeAnualidad) {
			total += 10;
		}
		
		// Agregar cuotas pendientes si existen
		if ($cuotasPendientes.length > 0) {
			total += $cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
		}
		
		return total;
	}

	// Manejar cambio en el checkbox de anualidad
	function handleAnualidadChange(incluye: boolean) {
		incluyeAnualidad = incluye;
		calcularDesglose();
	}

	// Wrapper para updateField
	function updateFieldWrapper(field: string, value: any) {
		form.update((current) => ({
			...current,
			[field]: value
		}));
	}

	// Calcular desglose cuando cambie el plan o la anualidad
	async function calcularDesglose() {
		if (!planSeleccionado) {
			montoDesglose = null;
			return;
		}

		try {
			const resultado = await pagoService.calcularMontoTotalConCuotas(
				cliente.idCliente,
				planSeleccionado.idPlan,
				incluyeAnualidad
			);
			montoDesglose = resultado.desglose;
		} catch (error) {
			console.warn('Error al calcular desglose:', error);
			montoDesglose = null;
		}
	}
	$: añoRenovacion = calcularAñoRenovacion();
	$: caracteresRestantes = 150 - ($form.observaciones?.length || 0);
	$: precioTotal = getPrecioTotal();

	// Reactivo: actualizar plan seleccionado cuando cambie idPlan en el form
	$: if ($form.idPlan) {
		handlePlanChange($form.idPlan);
	}

	// Reactivo: calcular desglose cuando cambie el plan o la anualidad
	$: if (planSeleccionado || incluyeAnualidad) {
		calcularDesglose();
	}
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">
			{isRenovacion ? 'Renovar Plan' : 'Nuevo Pago'}
		</h3>
	</svelte:fragment>	{#if $pagoStoreState}
		<div class="p-6 text-center">
			<div class="mb-4 rounded-md border border-yellow-300 bg-yellow-100 p-4">
				<h3 class="mb-2 font-bold text-yellow-800">⚠️ Deuda Activa Detectada</h3>
				<p class="text-yellow-700">
					Este cliente tiene un pago pendiente. Debe completar el pago anterior antes de registrar
					uno nuevo.
				</p>
			</div>
		</div>
	{:else if isRenovacion && !$renovacionState.puede}
		<div class="p-6 text-center">
			<div class="mb-4 rounded-md border border-red-300 bg-red-100 p-4">
				<h3 class="mb-2 font-bold text-red-800">❌ Renovación No Permitida</h3>
				<p class="text-red-700">{$renovacionState.mensaje}</p>
				{#if $renovacionState.diasRestantes && $renovacionState.diasRestantes > 5}
					<p class="mt-2 text-sm text-red-600">
						Podrás renovar cuando falten 5 días o menos para el vencimiento.
					</p>
				{/if}
			</div>
		</div>{:else}
		<form on:submit|preventDefault={handleSubmitForm}>
			<div class="space-y-4">				<p class="mb-4 text-sm text-gray-600">
					{isRenovacion ? 'Renovar membresía para' : 'Registrar nuevo pago para'}
					<strong>{cliente.nombre} {cliente.apellido}</strong>
				</p>				{#if isRenovacion && $renovacionState.diasRestantes !== undefined}
					<div class="rounded-md border border-green-200 bg-green-50 p-4">
						<h4 class="mb-2 font-bold text-green-800">✅ Renovación Permitida</h4>
						<p class="text-sm text-green-700">
							La membresía actual vence en <strong>{$renovacionState.diasRestantes}</strong> días. Puedes
							proceder con la renovación.
						</p>
					</div>
				{/if}

				<!-- Advertencia sobre cuotas pendientes -->
				{#if isRenovacion && $cuotasPendientes.length > 0}
					<div class="rounded-md border border-orange-200 bg-orange-50 p-4">
						<h4 class="mb-2 font-bold text-orange-800">⚠️ Cuotas de Mantenimiento Pendientes</h4>
						<p class="text-sm text-orange-700 mb-2">
							Este cliente tiene <strong>{$cuotasPendientes.length}</strong> cuota{$cuotasPendientes.length > 1 ? 's' : ''} de mantenimiento pendiente{$cuotasPendientes.length > 1 ? 's' : ''}:
						</p>
						<ul class="text-sm text-orange-700 space-y-1">
							{#each $cuotasPendientes as cuota}
								<li class="flex justify-between">
									<span>• Año {cuota.anio}</span>
									<span class="font-medium">${cuota.monto.toFixed(2)}</span>
								</li>
							{/each}
						</ul>
						<div class="mt-2 pt-2 border-t border-orange-200">
							<p class="text-sm font-medium text-orange-800">
								Total cuotas pendientes: <span class="font-bold">${$cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0).toFixed(2)}</span>
							</p>
							<p class="text-xs text-orange-600 mt-1">
								Para renovar se debe incluir el pago de estas cuotas pendientes.
							</p>
						</div>
					</div>
				{/if}<!-- Componente modular para cuotas de mantenimiento -->
				<CuotaAnualidadField
					clienteId={cliente.idCliente}
					montoPlan={planSeleccionado?.precio || 0}
					bind:incluyeAnualidad
					cuotasPendientes={$cuotasPendientes}
					onAnualidadChange={handleAnualidadChange}
					updateField={updateFieldWrapper}
				/>

				<!-- Usar componente modular de formulario -->
				<PagoFormFields 
					bind:form={$form}
					{planes}
					{planSeleccionado}
					{precioTotal}
					{caracteresRestantes}
					errors={$errors}
					touched={$touched}
					{isRenovacion}
					{añoRenovacion}
					bind:incluyeAnualidad
					cuotasPendientes={$cuotasPendientes}
					{montoDesglose}
				/>
			</div>
		</form>
	{/if}	<svelte:fragment slot="footer">
		{#if $pagoStoreState || (isRenovacion && !$renovacionState.puede)}
			<Button variant="primary" on:click={onClose}>Entendido</Button>
		{:else}
			<Button variant="outline" on:click={onClose} type="button">Cancelar</Button>
			<Button variant="primary" on:click={handleSubmitForm} type="button" isLoading={isSubmitting}>
				{isRenovacion ? 'Renovar Plan' : 'Registrar Pago'}
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
