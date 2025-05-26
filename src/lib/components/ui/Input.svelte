<script lang="ts">
	import Icon from './Icon.svelte';

	export let label = '';
	export let helperText = '';
	export let errorMessage = '';
	export let type = 'text';
	export let error = false;
	export let leftIcon: string = '';
	export let rightIcon: string = '';
	export let unit: string = '';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let value = '';
	export let id = '';
	export let name = '';
	export let placeholder = '';
	export let disabled = false;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	// Agregar prop required
	export let required = false;
	// Crear un id único si no se proporciona
	$: inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="w-full space-y-1.5">
	{#if label}
		<label for={inputId} class="text-md font-bold text-[var(--letter)]">{label}</label>
	{/if}

	<div class="relative flex items-center">
		{#if leftIcon}
			<div class="text-muted-foreground pointer-events-none absolute left-3 flex items-center">
				<Icon name={leftIcon} size={16} className="text-gray-400" />
			</div>
		{/if}
		<input
			id={inputId}
			{name}
			{disabled}
			bind:value
			{type}
			{placeholder}
			{min}
			{max}
			{required}
			{...$$restProps}
			class={`focus-visible:ring-ring w-full rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 focus:ring-2 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50
        ${leftIcon ? 'pl-10' : ''} ${rightIcon || unit ? 'pr-14' : ''}
        ${size === 'sm' && 'h-8 text-sm'}
        ${size === 'md' && 'h-10 text-base'}
        ${size === 'lg' && 'h-12 text-lg'}
        ${error && 'border-red-500 focus:ring-red-500'}`}
			on:input
			on:change
			on:keydown
			on:focus
			on:blur
		/>

		{#if rightIcon || unit}
			<div
				class="pointer-events-none absolute right-1 flex h-full items-center border-l border-[var(--border)] px-3"
			>
				{#if unit}
					<span
						class="text-md text-muted-foreground font-[family-name:var(--font-main)] font-medium text-[var(--letter)]"
						>{unit}</span
					>
				{:else if rightIcon}
					<Icon name={rightIcon} size={16} className="text-gray-400" />
				{/if}
			</div>
		{/if}
	</div>

	{#if error && errorMessage}
		<p class="text-sm text-red-500">{errorMessage}</p>
	{:else if helperText}
		<p class="text-muted-foreground text-sm">{helperText}</p>
	{/if}
</div>
