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
	class={`flex items-center rounded-md px-4 py-2 transition-colors
    ${isActive ? 'bg-opacity-10 bg-[var(--primary)] text-[var(--primary)]' : 'text-[var(--letter)]'}
    hover:bg-opacity-10 hover:bg-[var(--primary)] hover:text-[var(--primary)]`}
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
>
	<span class="mr-2 text-xl">
		<Icon name={isActive || hovered ? activeIcon : icon} size={20} />
	</span>
	<span class="font-medium">{label}</span>
</a>
