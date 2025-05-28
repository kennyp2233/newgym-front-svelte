<!-- src/lib/components/auth/AuthButton.svelte -->
<script lang="ts">
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { isAuthenticated, user } from '$lib/stores/authStore';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	export let className: string = '';
	export let showUserInfo: boolean = true;

	let showUserMenu = false;

	async function handleSignIn() {
		await signIn('auth0', {
			callbackUrl: '/clientes',
			redirect: true
		});
	}

	async function handleSignOut() {
		await signOut({
			callbackUrl: '/',
			redirect: true
		});
	}

	function toggleUserMenu() {
		showUserMenu = !showUserMenu;
	}

	function closeUserMenu() {
		showUserMenu = false;
	}
</script>

{#if $isAuthenticated && $user}
	{#if showUserInfo}
		<div class="flex items-center gap-3 {className}">
			<div class="flex items-center gap-2">
				{#if $user.image}
					<img src={$user.image} alt={$user.name || 'Usuario'} class="h-8 w-8 rounded-full" />
				{/if}
				<div class="hidden sm:block">
					<p class="text-sm font-medium text-[var(--letter)]">
						{$user.name || $user.email}
					</p>
				</div>
			</div>

			<Button
				variant="outline"
				size="sm"
				on:click={handleSignOut}
				className="flex items-center gap-2"
			>
				<Icon name="logout" size={16} />
				<span class="hidden sm:inline">Cerrar sesión</span>
			</Button>
		</div>
	{:else}
		<!-- Versión compacta para navbar -->
		<div class="relative">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="group flex cursor-pointer items-center rounded-xl p-2 transition-all duration-300 hover:bg-gray-50/80 {className}"
				on:click={toggleUserMenu}
			>
				{#if $user.image}
					<img
						src={$user.image}
						alt={$user.name || 'Usuario'}
						class="h-7 w-7 rounded-full shadow-sm ring-2 ring-white transition-all duration-300 group-hover:ring-[var(--primary)]/20"
					/>
				{:else}
					<div
						class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-purple-600 shadow-sm"
					>
						<Icon name="user" size={14} className="text-white" />
					</div>
				{/if}
				<Icon
					name="chevron-down"
					size={12}
					className="ml-1 text-gray-400 group-hover:text-[var(--primary)] transition-all duration-300 {showUserMenu
						? 'rotate-180'
						: ''}"
				/>
			</div>

			<!-- Mini dropdown menu -->
			{#if showUserMenu}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element_interactions -->
				<div class="fixed inset-0 z-40" on:click={closeUserMenu}></div>
				<div
					class="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-gray-200/60 bg-white py-2 shadow-xl backdrop-blur-md"
				>
					<div class="border-b border-gray-100 px-3 py-2">
						<p class="truncate text-sm font-medium text-[var(--letter)]">
							{$user.name || $user.email}
						</p>
						<p class="truncate text-xs text-gray-500">
							{$user.email}
						</p>
					</div>
					<button
						class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors duration-200 hover:bg-red-50"
						on:click={handleSignOut}
					>
						<Icon name="logout" size={14} />
						Cerrar sesión
					</button>
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<Button
		variant="primary"
		size="sm"
		on:click={handleSignIn}
		className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-purple-600 hover:from-purple-600 hover:to-[var(--primary)] text-white shadow-lg hover:shadow-xl transition-all duration-300 {className}"
	>
		<Icon name="user" size={16} />
		<span class="hidden lg:inline">Iniciar sesión</span>
	</Button>
{/if}
