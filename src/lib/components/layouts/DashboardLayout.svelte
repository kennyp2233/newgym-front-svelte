<!-- src/lib/components/layouts/DashboardLayout.svelte -->
<script lang="ts">
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import ToastContainer from '$lib/components/ui/Toast/ToastContainer.svelte';
</script>

<div class="flex min-h-screen flex-col bg-[var(--background)] font-[family-name:var(--font-main)]">
	<Navbar />
	<main class="container mx-auto flex-grow px-4 py-6">
		<slot />
	</main>
	<!-- 
	<footer class="border-t border-[var(--border)] bg-white py-4">
		<div class="container mx-auto px-4 text-center text-sm text-[var(--letter)]">
			© {new Date().getFullYear()} CrossFit Tulcán. Todos los derechos reservados.
		</div>
	</footer>
	-->
</div>

<ToastContainer />
