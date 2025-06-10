<!-- src/lib/components/ui/NavbarSkeleton.svelte -->
<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
</script>

<nav class="border-b border-[var(--border)] bg-white shadow-sm">
	<div class="container mx-auto px-4">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo -->
			<div class="flex items-center space-x-3">
				<div class="h-8 w-8 animate-pulse rounded bg-gray-300"></div>
				<div class="h-6 w-32 animate-pulse rounded bg-gray-300"></div>
			</div>

			<!-- Navigation items -->
			<div class="hidden md:flex items-center space-x-6">
				<div class="h-4 w-16 animate-pulse rounded bg-gray-300" style="animation-delay: 0.1s"></div>
				<div class="h-4 w-20 animate-pulse rounded bg-gray-300" style="animation-delay: 0.2s"></div>
				<div class="h-4 w-24 animate-pulse rounded bg-gray-300" style="animation-delay: 0.3s"></div>
			</div>

			<!-- User menu -->
			<div class="flex items-center space-x-3">
				<div class="h-8 w-8 animate-pulse rounded-full bg-gray-300" style="animation-delay: 0.4s"></div>
				<div class="hidden sm:block">
					<div class="h-4 w-20 animate-pulse rounded bg-gray-300" style="animation-delay: 0.5s"></div>
				</div>
			</div>
		</div>
	</div>
</nav>

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
