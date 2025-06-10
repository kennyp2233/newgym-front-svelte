<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { debounce } from 'lodash-es';
	import FormField from '$lib/components/ui/forms/FormField.svelte';
	import { clienteService } from '../../api';

	export let value: string = '';
	export let errors: any = {};
	export let touched: any = {};
	export let isEditMode: boolean = false;
	export let currentCedula: string | undefined = undefined;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();
	
	let isValidating = false;
	let customError = '';

	// Función debounce para validación asíncrona
	const validateCedulaAsync = debounce(async (cedula: string) => {
		if (!cedula || cedula.length < 10) {
			customError = '';
			isValidating = false;
			return;
		}

		// Si está en modo edición y la cédula no cambió, no validar
		if (isEditMode && cedula === currentCedula) {
			customError = '';
			isValidating = false;
			return;
		}

		isValidating = true;
		customError = '';

		try {
			const exists = await clienteService.verificarCedulaExiste(cedula);
			if (exists) {
				customError = 'Esta cédula ya está registrada';
				dispatch('validationError', { field: 'cedula', error: customError });
			} else {
				customError = '';
				dispatch('validationSuccess', { field: 'cedula' });
			}
		} catch (error) {
			console.warn('Error verificando cédula:', error);
			// En caso de error de red, no mostrar error
			customError = '';
		} finally {
			isValidating = false;
		}
	}, 800); // Esperar 800ms después de que el usuario deje de escribir

	// Reactivo: ejecutar validación cuando cambie el valor
	$: if (value) {
		validateCedulaAsync(value);
	}

	// Función para manejar cambios en el input
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		dispatch('input', { value });
		
		// Limpiar error personalizado si el usuario está escribiendo
		if (customError) {
			customError = '';
		}
	}

	// Combinar errores del esquema de validación con errores personalizados
	$: combinedErrors = {
		...errors,
		...(customError ? { cedula: customError } : {})
	};
</script>

<div class="relative">
	<FormField
		name="cedula"
		label="Cédula"
		placeholder="Ej: 0401010101"
		{value}
		errors={combinedErrors}
		{touched}
		{disabled}
		on:input={handleInput}
	/>
	
	<!-- Indicador de validación -->
	{#if isValidating}
		<div class="absolute right-3 top-9 flex items-center">
			<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
		</div>
	{:else if value && value.length >= 10 && !customError && !errors.cedula}
		<div class="absolute right-3 top-9 flex items-center">
			<svg class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
			</svg>
		</div>
	{:else if value && value.length >= 10 && (customError || errors.cedula)}
		<div class="absolute right-3 top-9 flex items-center">
			<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
			</svg>
		</div>
	{/if}
</div>
