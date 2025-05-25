<script lang="ts">
	import Icon from './Icon.svelte';

	export let type: 'button' | 'submit' = 'button';
	export let variant:
		| 'primary'
		| 'secondary'
		| 'outline'
		| 'ghost'
		| 'link'
		| 'danger'
		| 'success' = 'primary';
	export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' = 'md';
	export let fullWidth = false;
	export let isLoading = false;
	export let disabled = false;
	export let leftIcon: string = '';
	export let rightIcon: string = '';
	export let iconSize: number = 16;
	export let className: string = '';
</script>

<button
	{type}
	class={`inline-flex cursor-pointer items-center justify-center rounded-md font-bold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-50
    ${variant === 'primary' && 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'}
    ${variant === 'secondary' && 'bg-[var(--secondary)] text-white hover:bg-[var(--secondary-hover)]'}
    ${variant === 'outline' && 'border-input hover:bg-accent hover:text-accent-foreground border bg-transparent'}
    ${variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground'}
    ${variant === 'link' && 'text-primary underline-offset-4 hover:underline'}
    ${variant === 'danger' && 'bg-red-500 text-white hover:bg-red-600'}
    ${variant === 'success' && 'bg-green-500 text-white hover:bg-green-600'}

    ${size === 'xs' && 'h-8 px-3 text-xs'}
    ${size === 'sm' && 'h-9 px-3 text-sm'}
    ${size === 'md' && 'h-10 px-4 text-base'}
    ${size === 'lg' && 'h-11 px-6 text-lg'}
    ${size === 'xl' && 'h-12 px-8 text-xl'}
    ${size === 'icon' && 'h-10 w-10'}

    ${fullWidth && 'w-full'}

	${className}`}
	disabled={isLoading || disabled}
	on:click
	on:mouseenter
	on:mouseleave
>
	{#if isLoading}
		<svg class="mr-2 -ml-1 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			/>
		</svg>
	{/if}
	{#if !isLoading && leftIcon}
		<span class="mr-2">
			<Icon name={leftIcon} size={iconSize} />
		</span>
	{/if}
	<slot />
	{#if !isLoading && rightIcon}
		<span class="ml-2">
			<Icon name={rightIcon} size={iconSize} />
		</span>
	{/if}
</button>
