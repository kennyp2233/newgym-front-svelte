<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { isAuthenticated } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import AuthButton from '$lib/components/auth/AuthButton.svelte';

	onMount(() => {
		if ($isAuthenticated) {
			goto('/clientes');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-[var(--background)]">
	<div class="text-center">
		<h1 class="mb-4 text-4xl font-bold text-[var(--letter)]">CrossFit Tulcán</h1>
		<p class="mb-8 text-lg text-gray-600">Sistema de gestión de clientes</p>

		<AuthButton className="text-lg px-8 py-3" showUserInfo={false} />
	</div>
</div>
