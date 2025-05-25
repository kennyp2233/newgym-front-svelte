<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { whatsappService } from './whatsappService';
	import { initializeSocket, onWhatsAppStatus, onWhatsAppAuth } from '$lib/services/socketService';
	import { toasts } from '$lib/stores/toastStore';

	type Conn = 'connected' | 'disconnected' | 'loading';

	let status: Conn = 'loading';
	let isModalOpen = false;
	let isRefreshing = false;
	let lastCheck: Date | null = null;
	let connectionDetails: { connected: boolean; message: string; timestamp: string } | null = null;

	function showToast(msg: string, type: 'success' | 'info' | 'error') {
		toasts.showToast(msg, type);
	}

	async function checkStatus() {
		try {
			const [st, conn] = await Promise.all([
				whatsappService.getStatus(),
				whatsappService.checkConnection()
			]);
			status = st.status === 'connected' ? 'connected' : 'disconnected';
			connectionDetails = conn;
			lastCheck = new Date();
		} catch {
			status = 'disconnected';
		}
	}

	async function resetSession() {
		isRefreshing = true;
		try {
			const res = await whatsappService.resetSession();
			if (res.status === 'success') {
				showToast('Sesión de WhatsApp verificada', 'info');
				status = 'disconnected';
				setTimeout(checkStatus, 1000);
			} else {
				showToast(res.message, 'error');
			}
		} catch {
			showToast('Error al reiniciar sesión', 'error');
		} finally {
			isRefreshing = false;
		}
	}

	async function sendTestMessage() {
		const phone = prompt('Ingrese el número de teléfono (código de país):');
		if (!phone) return;
		isRefreshing = true;
		try {
			const res = await whatsappService.sendTestMessage(phone);
			if (res.status === 'success') showToast('Mensaje enviado', 'success');
			else showToast(res.message, 'error');
		} catch {
			showToast('Error al enviar mensaje', 'error');
		} finally {
			isRefreshing = false;
		}
	}

	function handleShow() {
		isModalOpen = true;
		checkStatus();
	}

	function getStatusColor() {
		return status === 'connected'
			? 'bg-green-500'
			: status === 'disconnected'
				? 'bg-red-500'
				: 'bg-yellow-500';
	}

	onMount(() => {
		initializeSocket();
		const offStatus = onWhatsAppStatus(
			(s) => (status = s === 'connected' ? 'connected' : 'disconnected')
		);
		const offAuth = onWhatsAppAuth((a) => {
			if (a === 'authenticated') {
				showToast('WhatsApp autenticado', 'success');
				status = 'connected';
				isModalOpen = false;
			} else {
				showToast('Error de autenticación', 'error');
				status = 'disconnected';
			}
		});
		checkStatus();
		return () => {
			offStatus();
			offAuth();
		};
	});
</script>

<Button variant="ghost" on:click={handleShow} className="flex items-center gap-2">
	<Icon name="whatsapp" size={20} />
	<span class="hidden md:inline">WhatsApp</span>
	<span class={`h-2 w-2 rounded-full ${getStatusColor()}`}></span>
</Button>

<BaseModal isOpen={isModalOpen} onClose={() => (isModalOpen = false)} size="md" closeOnClickOutside>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">Estado de WhatsApp</h3>
	</svelte:fragment>

	<div class="space-y-4">
		<div class="flex flex-col items-center space-y-3 rounded-lg bg-[var(--sections)] p-4">
			<div class="flex items-center space-x-2">
				<Icon name="whatsapp" size={32} className="text-green-500" />
				<h4 class="text-lg font-semibold">
					{status === 'connected' ? 'Conectado' : 'Desconectado'}
				</h4>
				<span class={`h-3 w-3 rounded-full ${getStatusColor()}`}></span>
			</div>
			<p class="text-center text-sm text-gray-600">
				{status === 'connected'
					? 'Listo para enviar mensajes automáticos.'
					: 'Configure UltraMsg en .env del servidor.'}
			</p>
			{#if lastCheck}
				<p class="text-xs text-gray-500">Última verificación: {lastCheck.toLocaleTimeString()}</p>
			{/if}
		</div>

		{#if status === 'disconnected'}
			<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
				<h4 class="mb-2 font-semibold text-blue-700">Configuración requerida</h4>
				<ul class="list-disc space-y-1 pl-5 text-sm text-blue-600">
					<li>Crear cuenta en UltraMsg</li>
					<li>Obtener Instance ID y Token</li>
					<li>Configurar ULTRAMSG_INSTANCE y ULTRAMSG_TOKEN en .env</li>
					<li>Reiniciar servidor</li>
				</ul>
			</div>
		{/if}

		{#if connectionDetails}
			<div class="rounded-lg bg-gray-50 p-4">
				<h4 class="mb-2 font-semibold text-gray-700">Detalles de conexión</h4>
				<p class="mb-2 text-xs text-gray-600">
					<span
						class={connectionDetails.connected
							? 'flex items-center text-green-600'
							: 'flex items-center text-red-600'}
					>
						<Icon
							name={connectionDetails.connected ? 'check' : 'warning'}
							size={16}
							className="mr-1"
						/>
						{connectionDetails.message}
					</span>
				</p>
				<p class="text-xs text-gray-500">
					Verificado: {new Date(connectionDetails.timestamp).toLocaleTimeString()}
				</p>
			</div>
		{/if}

		<div class="flex flex-col justify-center gap-3 md:flex-row">
			<Button variant="outline" on:click={resetSession} isLoading={isRefreshing}>
				<Icon name="refresh" size={16} className="mr-2" />
				Verificar estado
			</Button>

			{#if status === 'connected'}
				<Button variant="primary" on:click={sendTestMessage}>
					<Icon name="whatsapp" size={16} className="mr-2" />
					Enviar prueba
				</Button>
			{/if}
		</div>

		{#if status === 'connected'}
			<div class="mt-6 w-full rounded-lg border border-green-200 bg-green-50 p-4 text-center">
				<h4 class="mb-2 font-semibold text-green-700">¡Todo está funcionando!</h4>
				<ul class="list-disc space-y-1 pl-5 text-sm text-gray-700">
					<li>Notificaciones enviadas automáticamente</li>
					<li>Confirmaciones de inscripción</li>
					<li>Recordatorios de renovación</li>
					<li>Notificaciones de nuevas medidas</li>
				</ul>
			</div>
		{/if}
	</div>
</BaseModal>
