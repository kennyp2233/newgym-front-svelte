<script lang="ts">
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { createEventDispatcher } from 'svelte';
	import { toasts } from '$lib/stores/toastStore';
	import { whatsappService } from './whatsappService';

	export let isOpen = false;

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	let phoneNumber = '';
	let isLoading = false;
	let error = '';

	// Reiniciar valores cuando se abre el modal
	$: if (isOpen) {
		phoneNumber = '';
		error = '';
		isLoading = false;
	}

	function handleClose() {
		if (!isLoading) {
			dispatch('close');
		}
	}

	function validatePhone(phone: string): boolean {
		// Validación básica: debe contener solo dígitos, +, -, espacios y paréntesis
		const phoneRegex = /^[\d\s\-\+\(\)]+$/;
		if (!phoneRegex.test(phone.trim())) {
			return false;
		}
		
		// Debe tener al menos 8 dígitos
		const digitsOnly = phone.replace(/\D/g, '');
		return digitsOnly.length >= 8;
	}

	async function handleSendTest() {
		error = '';
		
		if (!phoneNumber.trim()) {
			error = 'Por favor ingrese un número de teléfono';
			return;
		}

		if (!validatePhone(phoneNumber)) {
			error = 'Formato de teléfono inválido. Use el formato internacional (+593XXXXXXXXX)';
			return;
		}

		isLoading = true;
		
		try {
			const cleanPhone = phoneNumber.trim();
			const res = await whatsappService.sendTestMessage(cleanPhone);
			
			if (res.status === 'success') {
				toasts.showToast('¡Mensaje de prueba enviado exitosamente!', 'success');
				handleClose();
			} else {
				error = res.message || 'Error al enviar el mensaje';
			}
		} catch {
			error = 'Error de conexión. Verifique su conexión a internet';
		} finally {
			isLoading = false;
		}
	}

	function formatPhoneNumber(value: string) {
		// Auto-formatear para Ecuador (+593)
		let cleaned = value.replace(/\D/g, '');
		
		if (cleaned.startsWith('593')) {
			cleaned = '+' + cleaned;
		} else if (cleaned.length === 9 && cleaned.startsWith('9')) {
			// Si parece un número ecuatoriano sin código de país
			cleaned = '+593' + cleaned;
		} else if (cleaned.length > 0 && !cleaned.startsWith('+')) {
			cleaned = '+' + cleaned;
		}
		
		return cleaned;
	}

	function handlePhoneInput(event: Event) {
		const target = event.target as HTMLInputElement;
		phoneNumber = formatPhoneNumber(target.value);
	}
</script>

<BaseModal {isOpen} onClose={handleClose} size="md" closeOnClickOutside={!isLoading}>
	<svelte:fragment slot="header">		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
				<Icon name="whatsapp" size={20} className="text-green-600" />
			</div>
			<div>
				<h3 class="text-lg font-semibold text-gray-900">Enviar Mensaje de Prueba</h3>
				<p class="text-sm text-gray-500">Verificar funcionamiento de WhatsApp</p>
			</div>
		</div>
	</svelte:fragment>
	<!-- Información -->
	<div class="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">
		<div class="flex items-start gap-3">
			<Icon name="info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
			<div class="text-sm text-blue-700">
				<p class="font-medium mb-1">¿Qué hace esta prueba?</p>
				<ul class="text-xs space-y-1 list-disc list-inside">
					<li>Envía un mensaje de prueba al número especificado</li>
					<li>Verifica que la conexión de WhatsApp funciona correctamente</li>
					<li>Confirma que los mensajes automáticos del sistema funcionarán</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Campo de teléfono -->
	<div class="space-y-2 mb-6">
		<label for="phone" class="block text-sm font-medium text-gray-700">
			Número de teléfono
		</label>
		<Input
			id="phone"
			bind:value={phoneNumber}
			on:input={handlePhoneInput}
			placeholder="+593987654321"
			leftIcon="phone"
			error={!!error}
			errorMessage={error}
			disabled={isLoading}
			className="font-mono"
		/>
		<div class="text-xs text-gray-500">
			<p><strong>Formato:</strong> Código de país + número (ej: +593987654321)</p>
			<p><strong>Importante:</strong> El número debe tener WhatsApp activo</p>
		</div>
	</div>

	<!-- Ejemplos -->
	<div class="space-y-2">
		<p class="text-sm font-medium text-gray-700">Ejemplos de formato:</p>
		<div class="grid grid-cols-1 gap-2 text-xs">
			<div class="flex items-center gap-2 rounded bg-gray-50 p-2">
				<Icon name="check" size={12} className="text-green-500" />
				<code class="font-mono">+593987654321</code>
				<span class="text-gray-600">(Ecuador)</span>
			</div>
			<div class="flex items-center gap-2 rounded bg-gray-50 p-2">
				<Icon name="check" size={12} className="text-green-500" />
				<code class="font-mono">+1234567890</code>
				<span class="text-gray-600">(Estados Unidos)</span>
			</div>
			<div class="flex items-center gap-2 rounded bg-gray-50 p-2">
				<Icon name="check" size={12} className="text-green-500" />
				<code class="font-mono">+5491123456789</code>
				<span class="text-gray-600">(Argentina)</span>
			</div>
		</div>
	</div>

	<svelte:fragment slot="footer">
		<Button variant="outline" on:click={handleClose} disabled={isLoading}>
			Cancelar
		</Button>
		<Button variant="primary" on:click={handleSendTest} isLoading={isLoading} disabled={!phoneNumber.trim()}>
			<Icon name="whatsapp" size={16} className="mr-2" />
			{isLoading ? 'Enviando...' : 'Enviar Mensaje de Prueba'}
		</Button>
	</svelte:fragment>
</BaseModal>
