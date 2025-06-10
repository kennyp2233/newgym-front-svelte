<!-- src/routes/auth/signin/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { signIn } from '@auth/sveltekit/client';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { authLoading, clearAuthError } from '$lib/stores/authStore';
	import { onMount } from 'svelte';

	export let data: PageData;

	let isLoading = false;

	onMount(() => {
		clearAuthError();
	});

	async function handleSignIn() {
		isLoading = true;
		authLoading.set(true);

		try {
			await signIn('auth0', {
				callbackUrl: data.callbackUrl || '/clientes',
				redirect: true
			});
		} catch (error) {
			console.error('Error al iniciar sesión:', error);
		} finally {
			isLoading = false;
			authLoading.set(false);
		}
	}
</script>

<svelte:head>
	<title>Iniciar Sesión - CrossFit Tulcán</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[var(--background)]">
	<div class="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-[var(--letter)]">Bienvenido a CrossFit Tulcán</h2>
			<p class="mt-2 text-sm text-gray-600">Inicia sesión para acceder al sistema de gestión</p>
		</div>

		{#if data.error}
			<div class="rounded-md border border-red-200 bg-red-50 p-4">
				<div class="flex items-center">
					<Icon name="warning" size={16} className="text-red-500 mr-2" />
					<p class="text-sm text-red-700">
						{#if data.error === 'OAuthSignin'}
							Error al iniciar sesión con Auth0
						{:else if data.error === 'OAuthCallback'}
							Error en el proceso de autenticación
						{:else if data.error === 'Configuration'}
							Error de configuración del sistema
						{:else}
							Ha ocurrido un error. Intenta nuevamente.
						{/if}
					</p>
				</div>
			</div>
		{/if}

		<div class="space-y-4">
			<Button
				variant="primary"
				fullWidth
				size="lg"
				on:click={handleSignIn}
				{isLoading}
				disabled={isLoading}
				className="flex items-center justify-center gap-3"
			>
				{#if !isLoading}
					<Icon name="user" size={20} />
				{/if}
				{isLoading ? 'Iniciando sesión...' : 'Iniciar sesión con Auth0'}
			</Button>

			<p class="text-center text-xs text-gray-500">Sistema seguro de autenticación</p>
		</div>
	</div>
</div>
