<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let href = '/';
	export let label = '';
	export let icon: any;
	export let activeIcon: any;
	export let isActive = false;

	let hovered = false;
	const dispatch = createEventDispatcher();

	function click() {
		dispatch('navigate', href);
	}
</script>

<a
	{href}
	class={`flex items-center rounded-md px-4 py-2 transition-colors
    ${isActive ? 'bg-opacity-10 bg-[var(--primary)] text-[var(--primary)]' : 'text-[var(--letter)]'}
    hover:bg-opacity-10 hover:bg-[var(--primary)] hover:text-[var(--primary)]`}
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
>
	<span class="mr-2 text-xl">
		{#if isActive || hovered}
			<svelte:component this={activeIcon} />
		{:else}
			<svelte:component this={icon} />
		{/if}
	</span>
	<span class="font-medium">{label}</span>
</a>
