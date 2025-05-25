<script lang="ts">
	import NavItem from './NavItem.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import WhatsAppStatus from '$lib/components/ui/WhatsAppStatus.svelte';
	import Logo from '$lib/assets/logo.svg';
	import Logo2 from '$lib/assets/logo_khannda.svg';
	import {
		RiFileList3Line,
		RiFileList3Fill,
		RiLogoutBoxLine,
		RiLogoutBoxRLine
	} from 'svelte-icons/ri';
	import { BsPeople, BsPeopleFill } from 'svelte-icons/bs';
	import { MdOutlineSpaceDashboard, MdSpaceDashboard } from 'svelte-icons/md';
	import { toasts } from '$lib/stores/toastStore';

	let logoutHovered = false;

	function handleLogout() {
		toasts.showToast('Sesión cerrada correctamente', 'success');
		// navegar a /login si usas $app/navigation
	}
</script>

<header class="border-b border-[var(--border)] bg-white shadow-sm">
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<!-- Logo -->
		<div class="flex items-center space-x-2">
			<img src={Logo} alt="Logo" class="w-10" />
			<div class="flex flex-col leading-tight">
				<h1 class="text-xl font-bold text-[var(--letter)]">Crossfit Tulcán</h1>
				<div class="flex items-center text-sm text-gray-500">
					<span class="mr-1">Hecho por</span>
					<img src={Logo2} alt="Khannda" class="h-4 w-4" />
					<span class="ml-1 text-[var(--letter)]">Khannda</span>
				</div>
			</div>
		</div>

		<!-- Nav -->
		<nav class="flex items-center space-x-2">
			<NavItem
				href="/clientes"
				label="Clientes"
				icon={BsPeople}
				activeIcon={BsPeopleFill}
				isActive={$page.url.pathname.startsWith('/clientes')}
			/>
			<NavItem
				href="/contabilidad"
				label="Contabilidad"
				icon={MdOutlineSpaceDashboard}
				activeIcon={MdSpaceDashboard}
				isActive={$page.url.pathname.startsWith('/contabilidad')}
			/>
		</nav>

		<!-- Actions -->
		<div class="flex items-center space-x-2">
			<WhatsAppStatus />

			<Button
				variant="ghost"
				on:click={handleLogout}
				on:mouseenter={() => (logoutHovered = true)}
				on:mouseleave={() => (logoutHovered = false)}
				class="text-[var(--letter)] hover:bg-red-50 hover:text-red-500"
			>
				<span class="mr-2 text-xl">
					{logoutHovered ? RiLogoutBoxRLine : RiLogoutBoxLine}
				</span>
				<span class="hidden sm:inline">Salir</span>
			</Button>
		</div>
	</div>
</header>
