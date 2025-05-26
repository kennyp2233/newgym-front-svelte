<!-- src/lib/components/ui/Select.svelte -->
<script lang="ts">
	export let label = '';
	export let helperText = '';
	export let errorMessage = '';
	export let error = false;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let options: { value: string; label: string }[] = [];
	export let value = '';
	export let id = '';
	export let name = '';
	export let disabled = false;
	export let required = false;
	// Crear un id único si no se proporciona
	$: inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="w-full space-y-1.5">
	{#if label}
		<label for={inputId} class="text-md font-bold text-[var(--letter)]">
			{label}
			{#if required}<span class="text-red-500">*</span>{/if}
		</label>
	{/if}

	<div class="relative">		<select
			id={inputId}
			{name}
			bind:value
			{disabled}
			{required}
			class={`w-full cursor-pointer appearance-none rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 pr-10 focus:ring-2 focus:ring-offset-2 focus-visible:outline-none
        ${size === 'sm' && 'h-8 text-sm'}
        ${size === 'md' && 'h-10 text-base'}
        ${size === 'lg' && 'h-12 text-lg'}
        ${error && 'border-red-500 focus:ring-red-500'}`}
			on:change
			on:blur
			on:focus
		>
			{#each options as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>

	{#if error && errorMessage}
		<p class="text-sm text-red-500">{errorMessage}</p>
	{:else if helperText}
		<p class="text-muted-foreground text-sm">{helperText}</p>
	{/if}
</div>
