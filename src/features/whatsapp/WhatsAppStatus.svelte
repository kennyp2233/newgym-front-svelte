<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import { whatsappService } from './whatsappService';
	import { initializeSocket, onWhatsAppStatus, onWhatsAppAuth } from '$lib/services/socketService';
	import { toasts } from '$lib/stores/toastStore';
	import { whatsappModalStore } from './whatsappModalStore';

	type Conn = 'connected' | 'disconnected' | 'loading';
	let status: Conn = 'loading';
	let isDropdownOpen = false;
	let showDetailModal = false;
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
		console.log('Opening WhatsApp test modal...'); // Debug
		whatsappModalStore.openTestModal();
		isDropdownOpen = false;
	}
	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
		if (isDropdownOpen) {
			checkStatus();
		}
	}

	function openDetailModal() {
		showDetailModal = true;
		isDropdownOpen = false;
	}

	function getStatusColor() {
		return status === 'connected'
			? 'bg-green-500'
			: status === 'disconnected'
				? 'bg-red-500'
				: 'bg-yellow-500';
	}

	function getStatusText() {
		return status === 'connected'
			? 'Conectado'
			: status === 'disconnected'
				? 'Desconectado'
				: 'Verificando...';
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
				isDropdownOpen = false;
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

<div class="relative">
	<button
		class="group relative flex cursor-pointer items-center gap-2 rounded-lg bg-transparent px-3 py-2 transition-all duration-300 ease-out hover:bg-gray-100"
		on:click={toggleDropdown}
	>
		<div class="relative">
			<Icon
				name="whatsapp"
				size={18}
				className="text-green-600 transition-transform duration-300 group-hover:scale-105"
			/>
			<span
				class={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${getStatusColor()} ${status === 'loading' ? 'animate-pulse' : ''}`}
			></span>
		</div>
		<span class="hidden text-sm font-medium text-gray-700 lg:inline">WhatsApp</span>
		<Icon
			name="chevron-down"
			size={14}
			className="text-gray-500 transition-transform duration-300 {isDropdownOpen
				? 'rotate-180'
				: ''}"
		/>
	</button>

	{#if isDropdownOpen}
		<div
			class="absolute top-full right-0 z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
		>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<h4 class="text-sm font-semibold text-gray-900">Estado WhatsApp</h4>
					<div class="flex items-center gap-2">
						<span class={`h-2 w-2 rounded-full ${getStatusColor()}`}></span>
						<span class="text-xs text-gray-600">{getStatusText()}</span>
					</div>
				</div>

				{#if connectionDetails}
					<div class="text-xs text-gray-500">
						<p>Última verificación: {lastCheck?.toLocaleTimeString()}</p>
						<p>Estado: {connectionDetails.message}</p>
					</div>
				{/if}
				<div class="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						on:click={resetSession}
						disabled={isRefreshing}
						className="flex-1"
					>
						{isRefreshing ? 'Verificando...' : 'Verificar'}
					</Button>
					<Button size="sm" variant="outline" on:click={sendTestMessage} className="flex-1">
						Test
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<BaseModal isOpen={showDetailModal} onClose={() => (showDetailModal = false)} size="lg">
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">Estado de WhatsApp</h3>
	</svelte:fragment>

	<!-- Contenido principal del modal -->
	<div class="space-y-4">
		<!-- Estado principal -->
		<div class="flex flex-col items-center space-y-3 rounded-lg bg-gray-50 p-4">
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

		<!-- Configuración requerida (solo si está desconectado) -->
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

		<!-- Detalles de conexión -->
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

		<!-- Botones de acción -->
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

		<!-- Estado de éxito (solo si está conectado) -->
		{#if status === 'connected'}
			<div class="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
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
