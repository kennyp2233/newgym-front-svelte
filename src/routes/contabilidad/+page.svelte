<!-- src/routes/contabilidad/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import DashboardLayout from '$lib/components/layouts/DashboardLayout.svelte';
	import DashboardContabilidad from '../../features/estadisticas/components/DashboardContabilidad.svelte';
	import { browser } from '$app/environment';

	// Metadatos de la página (esto se podría manejar en un +page.ts si se necesita SSR)
	onMount(() => {
		if (browser) {
			document.title = 'Crossfit Tulcán | Contabilidad';

			// Opcional: agregar meta description
			const metaDescription = document.querySelector('meta[name="description"]');
			if (metaDescription) {
				metaDescription.setAttribute(
					'content',
					'Dashboard de contabilidad y estadísticas financieras'
				);
			} else {
				const meta = document.createElement('meta');
				meta.name = 'description';
				meta.content = 'Dashboard de contabilidad y estadísticas financieras';
				document.head.appendChild(meta);
			}
		}
	});
</script>

<svelte:head>
	<title>Crossfit Tulcán | Contabilidad</title>
	<meta name="description" content="Dashboard de contabilidad y estadísticas financieras" />
</svelte:head>

<DashboardLayout>
	<div class="container mx-auto py-6">
		<DashboardContabilidad />
	</div>
</DashboardLayout>
