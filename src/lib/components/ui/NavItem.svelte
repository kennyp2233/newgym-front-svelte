<script lang="ts">
	import Icon from './Icon.svelte';

	export let href = '/';
	export let label = '';
	export let icon = ''; // string name instead of component
	export let activeIcon = ''; // string name instead of component
	export let isActive = false;

	let hovered = false;
</script>

<a
	{href}
	class="group relative mx-1 flex items-center rounded-lg px-4 py-2.5 transition-all duration-300 ease-out
		{isActive
		? 'bg-[var(--primary)] text-white shadow-sm'
		: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}"
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
>	<!-- Content -->
	<div class="relative flex items-center">
		<span class="mr-2.5 text-lg transition-all duration-300 ease-out">
			<Icon name={isActive || hovered ? activeIcon : icon} size={18} />
		</span>
		<span class="text-sm font-medium">{label}</span>
	</div>

	<!-- Active indicator -->
	{#if isActive}
		<div
			class="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 transform rounded-full bg-white/80"
		></div>
	{/if}
</a>
