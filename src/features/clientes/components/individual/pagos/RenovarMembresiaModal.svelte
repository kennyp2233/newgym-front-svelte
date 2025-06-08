<!-- src/features/clientes/components/individual/pagos/RenovarMembresiaModal.svelte -->
<!-- Modal específico para renovación de membresías -->
<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import { onMount } from 'svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { pagoService, type RenovacionPlanDTO } from '../../../../pagos/api';
	import { planService, type Plan } from '../../../../planes/api';
	import type { Cliente } from '../../../api';	import { toasts } from '$lib/stores/toastStore';
	
	// Importar composables específicos para renovación
	import { createPagoStore, createRenovacionValidator } from '../../../../pagos/composables/pagoComposables';
	import PagoFormFields from '../../../../pagos/forms/PagoFormFields.svelte';
	import { nuevoPagoValidationSchema, createRenovacionValidationSchema } from '../../../../pagos/forms/validationSchemas';
	
	// Importar API de cuotas-mantenimiento para verificación
	import { cuotaMantenimientoService } from '../../../../cuotas-mantenimiento/api';
	export let isOpen = false;
	export let cliente: Cliente;
	export let planActualId: number | undefined = undefined;
	export let onClose: () => void = () => {};
	export let onSuccess: () => void = () => {};

	// Estados usando composables específicos para renovación
	const pagoStore = createPagoStore(cliente.idCliente);
	const renovacionValidator = createRenovacionValidator(cliente);
	
	// Destructurar stores para acceso reactivo
	const { tieneDeudaActiva: pagoStoreState } = pagoStore;
	const { puedeRenovar: renovacionState } = renovacionValidator;
	
	let planes: Plan[] = [];
	let planSeleccionado: Plan | null = null;
	let isSubmitting = false;
	
	// Estados para cuotas de mantenimiento
	let cuotasPendientes: any[] = [];
	let loadingCuotas = false;	// Configuración del formulario para renovación de membresía
	const { form, errors, touched, updateField } = createForm({
		initialValues: {
			idPlan: planActualId?.toString() || '',
			monto: '', // Se calculará automáticamente al seleccionar plan
			fechaInicio: new Date().toISOString().split('T')[0],
			referencia: '',
			observaciones: ''
		},
		onSubmit: () => {} // Se manejará con handleSubmitForm
	});	// Función de validación usando esquema modular con validación de cuotas pendientes
	async function validateForm(): Promise<boolean> {
		try {
			// Usar el esquema de renovación que incluye validación de cuotas pendientes
			const validationSchema = createRenovacionValidationSchema(cuotasPendientes, planes);
			await validationSchema.validate($form, { abortEarly: false });
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
	}	// Función de submit para renovación de membresía
	async function handleSubmitForm() {
		const isValid = await validateForm();
		if (!isValid) {
			toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
			return;
		}

		// Verificar deuda activa usando composable
		if ($pagoStoreState) {
			toasts.showToast(
				'No se puede renovar la membresía mientras haya deuda pendiente. Complete el pago anterior primero.',
				'error'
			);
			return;
		}

		// Verificar renovación usando composable
		if (!$renovacionState.puede) {
			toasts.showToast($renovacionState.mensaje, 'error');
			return;
		}
		// La validación de cuotas pendientes ahora se maneja en el esquema de validación
		isSubmitting = true;
		const montoFinal = $form.monto ? parseFloat($form.monto.toString()) : precioTotal;
		
		// Determinar si hay cuotas pendientes y cuáles pagar
		const tieneCuotasPendientes = cuotasPendientes.length > 0;
		const cuotasPorPagar = tieneCuotasPendientes ? cuotasPendientes.map(c => c.idCuota || c.anio) : undefined;
		
		const exito = await pagoStore.crearPago({
			idCliente: cliente.idCliente,
			idPlan: parseInt($form.idPlan),
			monto: montoFinal,
			fechaInicio: $form.fechaInicio || undefined,
			referencia: $form.referencia || undefined,
			observaciones: $form.observaciones || undefined,
			// Configuración para cuotas de mantenimiento
			pagaCuotasPendientes: tieneCuotasPendientes,
			cuotasPorPagar: cuotasPorPagar
		});

		if (exito) {
			toasts.showToast('Membresía renovada exitosamente', 'success');
			onSuccess();
		}
		isSubmitting = false;
	}	// Cargar datos iniciales
	onMount(async () => {
		try {
			const planesData = await planService.getPlanes();
			planes = planesData;

			// Cargar datos usando composables
			await pagoStore.cargarPagos();
			await pagoStore.verificarDeudaActiva();
			await renovacionValidator.validarRenovacion();
			// Cargar cuotas pendientes para renovaciones PRIMERO
			await cargarCuotasPendientes();

			// DESPUÉS DE cargar cuotas, establecer el plan seleccionado
			if (planActualId) {
				const plan = planesData.find((p) => p.idPlan === planActualId);
				if (plan) {
					planSeleccionado = plan;
					// El monto se calculará automáticamente por la reactividad
					// pero también lo establecemos explícitamente para asegurar
					setTimeout(() => {
						const montoTotal = getPrecioTotal();
						updateFieldWrapper('monto', montoTotal.toString());
					}, 0);
				}
			}
		} catch (error) {
			console.error('Error al cargar datos:', error);
			toasts.showToast('Error al cargar información', 'error');
		}
	});// Cargar cuotas pendientes del backend - USA SOLO LOS DATOS DEL API
	async function cargarCuotasPendientes() {
		try {
			loadingCuotas = true;
			const response = await cuotaMantenimientoService.tieneCuotasPendientes(cliente.idCliente);
			
			// El backend ya nos da toda la información necesaria
			cuotasPendientes = response.cuotas || [];
			
		} catch (error) {
			console.error('Error al cargar cuotas pendientes:', error);
			cuotasPendientes = [];
			toasts.showToast('Error al cargar cuotas de mantenimiento', 'warning');
		} finally {
			loadingCuotas = false;
		}
	}
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
	}	// Actualizar plan seleccionado cuando cambia el idPlan
	function handlePlanChange(idPlan: string) {
		const plan = planes.find((p) => p.idPlan === parseInt(idPlan));
		planSeleccionado = plan || null;
		
		// AUTOMÁTICAMENTE establecer el monto total al seleccionar un plan
		if (plan) {
			const montoCompleto = getPrecioTotal();
			updateFieldWrapper('monto', montoCompleto.toString());
		}
	}	// Calcular precio total - USA SOLO LOS DATOS DEL BACKEND
	function getPrecioTotal(): number {
		if (!planSeleccionado) return getTotalCuotasPendientes(); // Solo cuotas si no hay plan
		
		let total = planSeleccionado.precio;
		
		// SOLO agregar las cuotas pendientes que vienen del backend (sin asumir $10 adicionales)
		if (cuotasPendientes && cuotasPendientes.length > 0) {
			const totalPendientes = cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
			total += totalPendientes;
		}
		
		return total;
	}

	// Función para calcular solo las cuotas pendientes del backend
	function getTotalCuotasPendientes(): number {
		if (!cuotasPendientes || cuotasPendientes.length === 0) return 0;
		return cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
	}

	// Función para obtener el monto mínimo requerido
	function getMontoMinimo(): number {
		const cuotasPendientesTotal = getTotalCuotasPendientes();
		
		// Si hay cuotas pendientes, el mínimo es cubrirlas
		if (cuotasPendientesTotal > 0) {
			return cuotasPendientesTotal;
		}
		
		// Si no hay cuotas pendientes pero hay plan seleccionado, el mínimo es el plan
		if (planSeleccionado) {
			return planSeleccionado.precio;
		}
		
		return 0;
	}

	// Wrapper para updateField
	function updateFieldWrapper(field: string, value: any) {
		form.update((current) => ({
			...current,
			[field]: value
		}));
	}	$: caracteresRestantes = 150 - ($form.observaciones?.length || 0);
	// Reactive calculation that depends explicitly on both variables
	$: precioTotal = (planSeleccionado || cuotasPendientes) ? getPrecioTotal() : 0;
	$: montoMinimo = getMontoMinimo();

	// Automatically update form amount when total price changes
	$: if (precioTotal > 0 && !$form.monto) {
		updateFieldWrapper('monto', precioTotal.toString());
	}

	// Reactivo: actualizar plan seleccionado cuando cambie idPlan en el form
	$: if ($form.idPlan) {
		handlePlanChange($form.idPlan);
	}
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">Renovar Membresía</h3>
	</svelte:fragment>{#if $pagoStoreState}
		<div class="p-6 text-center">
			<div class="mb-4 rounded-md border border-yellow-300 bg-yellow-100 p-4">
				<h3 class="mb-2 font-bold text-yellow-800">⚠️ Deuda Activa Detectada</h3>				<p class="text-yellow-700">
					Este cliente tiene un pago pendiente. Debe completar el pago anterior antes de renovar
					la membresía.
				</p>
			</div>
		</div>
	{:else if !$renovacionState.puede}
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
					Renovar membresía para <strong>{cliente.nombre} {cliente.apellido}</strong>
				</p>

				{#if $renovacionState.diasRestantes !== undefined}
					<div class="rounded-md border border-green-200 bg-green-50 p-4">
						<h4 class="mb-2 font-bold text-green-800">✅ Renovación Permitida</h4>
						<p class="text-sm text-green-700">
							La membresía actual vence en <strong>{$renovacionState.diasRestantes}</strong> días. Puedes
							proceder con la renovación.
						</p>
					</div>
				{/if}				<!-- Resumen de cuotas pendientes (solo si existen desde el backend) -->
				{#if cuotasPendientes.length > 0}
					<div class="rounded-md border border-orange-200 bg-orange-50 p-4">
						<h4 class="mb-2 font-bold text-orange-800">⚠️ Cuotas de Mantenimiento Pendientes</h4>
						<p class="text-sm text-orange-700 mb-3">
							Se incluirán automáticamente las siguientes cuotas pendientes en el pago:
						</p>
						
						<div class="bg-white rounded border border-orange-200 p-3 space-y-2">
							{#each cuotasPendientes as cuota}
								<div class="flex justify-between items-center text-sm">
									<span class="text-orange-800">• Cuota anual {cuota.anio}</span>
									<span class="font-medium text-orange-800">${cuota.monto.toFixed(2)}</span>
								</div>
							{/each}
							<div class="border-t border-orange-200 pt-2 mt-2">
								<div class="flex justify-between items-center font-bold text-orange-800">
									<span>Total cuotas pendientes:</span>
									<span>${getTotalCuotasPendientes().toFixed(2)}</span>
								</div>
							</div>
						</div>
						
						<p class="text-xs text-orange-600 mt-2 font-medium">
							💡 El sistema automáticamente incluirá estas cuotas en el pago de renovación.
						</p>
					</div>
				{:else}
					<!-- Sin cuotas pendientes -->
					<div class="rounded-md border border-green-200 bg-green-50 p-4">
						<h4 class="mb-2 font-bold text-green-800">✅ Sin Cuotas Pendientes</h4>
						<p class="text-sm text-green-700">
							No hay cuotas de mantenimiento pendientes. Solo se cobrará el plan seleccionado.
						</p>
					</div>
				{/if}

				<!-- Componente de formulario modular mejorado -->
				<div class="space-y-4 rounded-md border border-[var(--border)] bg-[var(--sections)] p-4">					<h3 class="text-lg font-semibold text-[var(--letter)]">Detalles de la renovación</h3>					<PagoFormFields 
						bind:form={$form}
						{planes}
						{planSeleccionado}
						{precioTotal}
						{caracteresRestantes}
						errors={$errors}
						touched={$touched}
						isRenovacion={true}
						{cuotasPendientes}
						helperTextMonto={`Monto total requerido: $${precioTotal.toFixed(2)} (Plan: $${planSeleccionado?.precio.toFixed(2) || '0.00'}${cuotasPendientes.length > 0 ? ` + Cuotas pendientes: $${getTotalCuotasPendientes().toFixed(2)}` : ''}). Mínimo: $${montoMinimo.toFixed(2)}`}
					/>
				</div>

				<!-- Resumen del pago mejorado -->
				{#if planSeleccionado}
					<div class="space-y-3 rounded-md border border-[var(--primary)] bg-[var(--primary)]/5 p-4">						<h3 class="text-lg font-semibold text-[var(--primary)]">Resumen de la renovación</h3>
						
						<div class="space-y-2 text-sm">
							<div class="grid grid-cols-2 gap-4">
								<div>
									<p class="font-medium text-gray-700">Plan seleccionado:</p>
									<p class="text-[var(--primary)]">{planSeleccionado.nombre}</p>
									<p class="text-xs text-gray-500">
										{planSeleccionado.duracionMeses} {planSeleccionado.duracionMeses === 1 ? 'mes' : 'meses'}
									</p>
								</div>
								<div>
									<p class="font-medium text-gray-700">Precio del plan:</p>
									<p class="text-lg font-bold text-[var(--primary)]">${planSeleccionado.precio.toFixed(2)}</p>
								</div>
							</div>							{#if cuotasPendientes.length > 0}
								<div class="border-t pt-3">
									<p class="font-medium text-gray-700 mb-2">Cuotas incluidas:</p>
									<div class="space-y-1">
										{#each cuotasPendientes as cuota}
											<div class="flex justify-between text-xs">
												<span>Cuota {cuota.anio}</span>
												<span>${cuota.monto.toFixed(2)}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<div class="border-t pt-3">
								<div class="flex justify-between items-center">
									<span class="font-bold text-gray-800">Total a pagar:</span>
									<span class="text-xl font-bold text-[var(--primary)]">${precioTotal.toFixed(2)}</span>
								</div>
								{#if $form.monto && parseFloat($form.monto) !== precioTotal}
									<div class="flex justify-between items-center text-sm mt-1">
										<span class="text-gray-600">Monto ingresado:</span>
										<span class="font-medium">${parseFloat($form.monto).toFixed(2)}</span>
									</div>
									{#if parseFloat($form.monto) < precioTotal}
										<p class="text-xs text-orange-600 mt-1">
											⚠️ Pago parcial - Restante: ${(precioTotal - parseFloat($form.monto)).toFixed(2)}
										</p>
									{/if}
								{/if}
							</div>

							{#if $form.fechaInicio}
								<div class="border-t pt-2 text-xs text-gray-600">
									<p>Fecha de inicio: {new Date($form.fechaInicio).toLocaleDateString()}</p>
									{#if planSeleccionado}
										{@const fechaFin = new Date($form.fechaInicio)}
										{@const _ = fechaFin.setMonth(fechaFin.getMonth() + planSeleccionado.duracionMeses)}
										<p>Fecha de fin: {fechaFin.toLocaleDateString()}</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</form>
	{/if}	<svelte:fragment slot="footer">
		{#if $pagoStoreState || !$renovacionState.puede}
			<Button variant="primary" on:click={onClose}>Entendido</Button>
		{:else}
			<Button variant="outline" on:click={onClose} type="button">Cancelar</Button>
			<Button variant="primary" on:click={handleSubmitForm} type="button" isLoading={isSubmitting}>
				Renovar Membresía
			</Button>
		{/if}
	</svelte:fragment>
</BaseModal>
