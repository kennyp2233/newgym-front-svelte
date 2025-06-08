<!-- src/lib/components/ui/ClientesSkeleton.svelte -->
<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="h-8 w-32 animate-pulse rounded bg-gray-300"></div>
	</div>

	<!-- Main content card -->
	<div class="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
		<!-- Search and Add button -->
		<div class="mb-6 flex justify-between">
			<div class="w-64">
				<div class="relative">
					<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
						<Icon name="search" size={16} className="text-gray-400" />
					</div>
					<div class="h-10 w-full animate-pulse rounded-md border border-gray-300 bg-gray-100 pl-10"></div>
				</div>
			</div>
			<div class="flex items-center gap-2 rounded-md bg-gray-300 px-4 py-2">
				<Icon name="add" size={16} className="text-gray-500" />
				<span class="text-gray-500">Agregar Cliente</span>
			</div>
		</div>

		<!-- Table skeleton -->
		<div class="overflow-hidden rounded-lg border border-gray-200">
			<!-- Table header -->
			<div class="bg-gray-50 px-6 py-3">
				<div class="grid grid-cols-6 gap-4">
					<div class="h-4 w-20 animate-pulse rounded bg-gray-300"></div>
					<div class="h-4 w-16 animate-pulse rounded bg-gray-300"></div>
					<div class="h-4 w-20 animate-pulse rounded bg-gray-300"></div>
					<div class="h-4 w-16 animate-pulse rounded bg-gray-300"></div>
					<div class="h-4 w-24 animate-pulse rounded bg-gray-300"></div>
					<div class="h-4 w-16 animate-pulse rounded bg-gray-300"></div>
				</div>
			</div>

			<!-- Table rows -->
			{#each Array(8) as _, i}
				<div class="border-t border-gray-200 px-6 py-4 {i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
					<div class="grid grid-cols-6 gap-4">
						<!-- Nombre -->
						<div class="h-4 w-32 animate-pulse rounded bg-gray-300" style="animation-delay: {i * 0.1}s"></div>
						<!-- Cédula -->
						<div class="h-4 w-24 animate-pulse rounded bg-gray-300" style="animation-delay: {i * 0.1 + 0.05}s"></div>
						<!-- Contacto -->
						<div class="h-4 w-28 animate-pulse rounded bg-gray-300" style="animation-delay: {i * 0.1 + 0.1}s"></div>
						<!-- Plan -->
						<div class="h-4 w-20 animate-pulse rounded bg-gray-300" style="animation-delay: {i * 0.1 + 0.15}s"></div>
						<!-- Días restantes -->
						<div class="h-4 w-16 animate-pulse rounded bg-gray-300" style="animation-delay: {i * 0.1 + 0.2}s"></div>
						<!-- Estado -->
						<div class="h-6 w-20 animate-pulse rounded-full bg-gray-300" style="animation-delay: {i * 0.1 + 0.25}s"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
	
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
