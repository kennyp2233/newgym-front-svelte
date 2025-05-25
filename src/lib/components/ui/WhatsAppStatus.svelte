<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import BaseModal from '$lib/components/modals/BaseModal.svelte';
  import { cn } from '$lib/utils';
  import { BsWhatsapp } from 'svelte-icons/bs';
  import { RiRefreshLine, RiCheckLine, RiErrorWarningLine } from 'svelte-icons/ri';
  import { whatsappService } from '$lib/services/whatsappService';
  import { initializeSocket, onWhatsAppStatus, onWhatsAppAuth } from '$lib/services/socketService';
  import { toasts } from '$lib/stores/toastStore';

  type Conn = 'connected' | 'disconnected' | 'loading';

  let status: Conn = 'loading';
  let isModalOpen = false;
  let isRefreshing = false;
  let lastCheck: Date | null = null;
  let connectionDetails: { connected: boolean; message: string; timestamp: string } | null = null;

  function showToast(msg: string, type: 'success'|'info'|'error') {
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
      showToast('Error al reiniciar sesión','error');
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
      if (res.status === 'success') showToast('Mensaje enviado','success');
      else showToast(res.message,'error');
    } catch {
      showToast('Error al enviar mensaje','error');
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
    const offStatus = onWhatsAppStatus(s => (status = s === 'connected' ? 'connected' : 'disconnected'));
    const offAuth = onWhatsAppAuth(a => {
      if (a === 'authenticated') {
        showToast('WhatsApp autenticado','success');
        status = 'connected';
        isModalOpen = false;
      } else {
        showToast('Error de autenticación','error');
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

<Button variant="ghost" on:click={handleShow} class="flex items-center gap-2">
  <BsWhatsapp class="text-xl" />
  <span class={cn('w-2 h-2 rounded-full animate-pulse', getStatusColor())} />
</Button>

<BaseModal
  {isModalOpen}
  onClose={() => (isModalOpen = false)}
  size="md"
  closeOnClickOutside
>
  <svelte:fragment slot="header">
    <h3 class="text-lg font-semibold">Estado de WhatsApp</h3>
  </svelte:fragment>

  <div class="space-y-4">
    <div class="bg-[var(--sections)] p-4 rounded-lg flex flex-col items-center space-y-3">
      <div class="flex items-center space-x-2">
        <BsWhatsapp class="text-2xl text-green-500" />
        <h4 class="text-lg font-semibold">
          {status === 'connected' ? 'Conectado' : 'Desconectado'}
        </h4>
        <span class={cn('w-3 h-3 rounded-full', getStatusColor())} />
      </div>
      <p class="text-sm text-gray-600 text-center">
        {status === 'connected'
          ? 'Listo para enviar mensajes automáticos.'
          : 'Configure UltraMsg en .env del servidor.'}
      </p>
      {#if lastCheck}
        <p class="text-xs text-gray-500">Última verificación: {lastCheck.toLocaleTimeString()}</p>
      {/if}
    </div>

    {#if status === 'disconnected'}
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 class="font-semibold text-blue-700 mb-2">Configuración requerida</h4>
        <ul class="list-disc pl-5 text-sm text-blue-600 space-y-1">
          <li>Crear cuenta en UltraMsg</li>
          <li>Obtener Instance ID y Token</li>
          <li>Configurar ULTRAMSG_INSTANCE y ULTRAMSG_TOKEN en .env</li>
          <li>Reiniciar servidor</li>
        </ul>
      </div>
    {/if}

    {#if connectionDetails}
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-semibold text-gray-700 mb-2">Detalles de conexión</h4>
        <p class="text-xs text-gray-600 mb-2">
          <span class={connectionDetails.connected ? 'text-green-600' : 'text-red-600'}>
            {#if connectionDetails.connected}
              <RiCheckLine class="inline mr-1" />
            {:else}
              <RiErrorWarningLine class="inline mr-1" />
            {/if}
            {connectionDetails.message}
          </span>
        </p>
        <p class="text-xs text-gray-500">
          Verificado: {new Date(connectionDetails.timestamp).toLocaleTimeString()}
        </p>
      </div>
    {/if}

    <div class="flex flex-col md:flex-row gap-3 justify-center">
      <Button
        variant="outline"
        on:click={resetSession}
        isLoading={isRefreshing}
        leftIcon={<RiRefreshLine />}
      >
        Verificar estado
      </Button>

      {#if status === 'connected'}
        <Button variant="primary" on:click={sendTestMessage} leftIcon={<BsWhatsapp />}>
          Enviar prueba
        </Button>
      {/if}
    </div>

    {#if status === 'connected'}
      <div class="mt-6 w-full p-4 bg-green-50 rounded-lg border border-green-200 text-center">
        <h4 class="font-semibold text-green-700 mb-2">¡Todo está funcionando!</h4>
        <ul class="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Notificaciones enviadas automáticamente</li>
          <li>Confirmaciones de inscripción</li>
          <li>Recordatorios de renovación</li>
          <li>Notificaciones de nuevas medidas</li>
        </ul>
      </div>
    {/if}
  </div>
</BaseModal>
