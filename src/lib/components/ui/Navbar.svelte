<!-- src/lib/components/ui/Navbar.svelte -->
<script lang="ts">
	import NavItem from './NavItem.svelte';
	import { page } from '$app/stores';
	import WhatsAppStatus from '../../../features/whatsapp/WhatsAppStatus.svelte';
	import AuthButton from '../auth/AuthButton.svelte';
	import Logo from '$lib/assets/logo.svg';
	import Logo2 from '$lib/assets/logo_khannda.svg';
	import { onMount } from 'svelte';

	let scrolled = false;
	let mobileMenuOpen = false;

	onMount(() => {
		const handleScroll = () => {
			scrolled = window.scrollY > 10;
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<header
	class="fixed top-0 right-0 left-0 z-50 transition-all duration-500 ease-out
		{scrolled
		? 'border-b border-gray-200/80 bg-white/98 shadow-xl shadow-black/5 backdrop-blur-xl'
		: 'border-b border-gray-100/60 bg-white/95 shadow-lg shadow-black/5 backdrop-blur-lg'}"
>
	<div class="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">		<!-- Logo Section - Limpio y original -->
		<div class="group flex items-center space-x-3">
			<div class="relative">
				<img
					src={Logo}
					alt="Logo"
					class="h-8 w-8 transition-transform duration-300 ease-out group-hover:scale-105"
				/>
			</div>
			<div class="flex flex-col leading-tight">
				<h1
					class="bg-gradient-to-r from-gray-800 to-red-600 bg-clip-text text-lg font-bold text-transparent transition-all duration-500"
				>
					Crossfit Tulcán
				</h1>
				<div
					class="flex items-center text-xs text-gray-500/80 transition-colors duration-500 group-hover:text-gray-600/90"
				>
					<span class="mr-1.5 font-medium">por</span>
					<div
						class="flex items-center rounded-full bg-gray-100/60 px-2 py-0.5 transition-all duration-500 group-hover:bg-gray-200/70"
					>
						<img src={Logo2} alt="Khannda" class="mr-1 h-3 w-3" />
						<span class="font-semibold text-[var(--letter)]">Khannda</span>
					</div>
				</div>
			</div>
		</div>
		<!-- Navigation Section - Flat y limpio -->
		<nav class="hidden items-center rounded-xl bg-gray-50/80 px-2 py-1 md:flex">
			<NavItem
				href="/clientes"
				label="Clientes"
				icon="people"
				activeIcon="people-fill"
				isActive={$page.url.pathname.startsWith('/clientes')}
			/>
			<NavItem
				href="/contabilidad"
				label="Contabilidad"
				icon="dashboard-outline"
				activeIcon="dashboard"
				isActive={$page.url.pathname.startsWith('/contabilidad')}
			/>
		</nav>

		<!-- Right Section - Limpio -->
		<div class="flex items-center space-x-2">
			<!-- Desktop Actions -->
			<div class="hidden items-center rounded-xl bg-gray-50/80 px-2 py-1 md:flex">
				<div class="flex items-center px-1">
					<WhatsAppStatus />
				</div>
				<div class="mx-1 h-6 w-px bg-gray-200/70"></div>
				<div class="flex items-center px-1">
					<AuthButton showUserInfo={false} />
				</div>
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="relative rounded-xl border border-gray-200/60 bg-white/90 p-2 shadow-lg shadow-black/5 backdrop-blur-md transition-all duration-300 ease-out hover:bg-gray-50/90 md:hidden"
				on:click={toggleMobileMenu}
			>
				<div class="relative flex h-5 w-5 flex-col items-center justify-center">
					<span
						class="absolute h-0.5 w-5 rounded-full bg-[var(--letter)] transition-all duration-300 ease-out {mobileMenuOpen
							? 'rotate-45'
							: '-translate-y-1.5'}"
					></span>
					<span
						class="absolute h-0.5 w-5 rounded-full bg-[var(--letter)] transition-all duration-300 ease-out {mobileMenuOpen
							? 'opacity-0'
							: ''}"
					></span>
					<span
						class="absolute h-0.5 w-5 rounded-full bg-[var(--letter)] transition-all duration-300 ease-out {mobileMenuOpen
							? '-rotate-45'
							: 'translate-y-1.5'}"
					></span>
				</div>
			</button>
		</div>
	</div>
	<!-- Mobile Navigation - Mejorado -->
	<div
		class="overflow-hidden transition-all duration-700 ease-out md:hidden {mobileMenuOpen
			? 'max-h-96 opacity-100'
			: 'max-h-0 opacity-0'}"
	>
		<div class="border-t border-gray-200/60 bg-white/98 backdrop-blur-xl">
			<nav class="container mx-auto space-y-2 px-4 py-6">
				<div
					on:click={closeMobileMenu}
					role="button"
					tabindex="0"
					class="transform transition-all duration-300 hover:translate-x-1"
				>
					<NavItem
						href="/clientes"
						label="Clientes"
						icon="people"
						activeIcon="people-fill"
						isActive={$page.url.pathname.startsWith('/clientes')}
					/>
				</div>
				<div
					on:click={closeMobileMenu}
					role="button"
					tabindex="0"
					class="transform transition-all duration-300 hover:translate-x-1"
				>
					<NavItem
						href="/contabilidad"
						label="Contabilidad"
						icon="dashboard-outline"
						activeIcon="dashboard"
						isActive={$page.url.pathname.startsWith('/contabilidad')}
					/>
				</div>
				<div class="mt-4 flex items-center justify-between border-t border-gray-200/60 pt-4">
					<div class="transform transition-all duration-300 hover:scale-105">
						<WhatsAppStatus />
					</div>
					<div class="transform transition-all duration-300 hover:scale-105">
						<AuthButton showUserInfo={false} />
					</div>
				</div>
			</nav>
		</div>
	</div>
</header>

<!-- Spacer más pequeño -->
<div class="h-16"></div>
