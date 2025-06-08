<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { isAuthenticated } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import AuthButton from '$lib/components/auth/AuthButton.svelte';
	import ClientesSkeleton from '$lib/components/ui/ClientesSkeleton.svelte';
	import NavbarSkeleton from '$lib/components/ui/NavbarSkeleton.svelte';
	import Logo from '$lib/assets/logo.svg';
	import Logo2 from '$lib/assets/logo_khannda.svg';

	onMount(() => {
		if ($isAuthenticated) {
			goto('/clientes');
		}
	});
</script>

<div class="relative min-h-screen bg-[var(--background)]">
	<!-- Background skeleton (blurred) -->
	<div class="absolute inset-0 opacity-40 blur-[2px] filter">
		<div
			class="flex min-h-screen flex-col bg-[var(--background)] font-[family-name:var(--font-main)]"
		>
			<NavbarSkeleton />
			<main class="container mx-auto flex-grow px-4 py-6">
				<ClientesSkeleton />
			</main>
			<footer class="border-t border-[var(--border)] bg-white py-4">
				<div class="container mx-auto px-4 text-center text-sm text-[var(--letter)]">
					© {new Date().getFullYear()} CrossFit Tulcán. Todos los derechos reservados.
				</div>
			</footer>
		</div>
	</div>

	<!-- Dark intermediate layer -->
	<div class="absolute inset-0 z-5 bg-black/20"></div>
	<!-- Overlay with auth form -->
	<div class="relative z-10 flex min-h-screen items-center justify-center">
		<div
			class="mx-4 w-full max-w-md rounded-xl border border-white/30 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-md"
		>
			<!-- Logo y título principal -->
			<div class="mb-6 flex flex-col items-center">
				<div class="group mb-3 flex items-center space-x-3">
					<img
						src={Logo}
						alt="Logo CrossFit Tulcán"
						class="h-10 w-10 transition-transform duration-300 ease-out group-hover:scale-105"
					/>
					<h1 class="text-3xl font-bold text-[var(--letter)]">CrossFit Tulcán</h1>
				</div>
				<p class="mb-4 text-base text-gray-600">Desarrollado por:</p>

				<div
					class="flex items-center rounded-lg border border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-2 shadow-sm"
				>
					<img src={Logo2} alt="Khannda" class="mr-2 h-5 w-5" />
					<span class="text-lg font-bold text-[var(--letter)]">KHANNDA</span>
				</div>
			</div>

			<div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
				<p class="text-sm text-blue-800">
					<span class="font-semibold">¡Bienvenido!</span><br />
					Inicia sesión para acceder al sistema de gestión de clientes
				</p>
			</div>

			<AuthButton className="w-full text-lg px-8 py-3" showUserInfo={false} />

			<div class="mt-6 text-xs text-gray-500">
				Gestor de clientes • Membresías • Pagos • Estadísticas
			</div>
		</div>
	</div>
</div>
