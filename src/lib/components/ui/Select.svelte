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

	// Crear un id único si no se proporciona
	$: inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

	// Manejar el evento change para actualizar el valor
	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		value = target.value;
	}
</script>

<div class="w-full space-y-1.5">
	{#if label}
		<label for={inputId} class="text-md font-bold text-[var(--letter)]">{label}</label>
	{/if}

	<div class="relative">
		<select
			id={inputId}
			{name}
			{value}
			{disabled}
			class={`w-full appearance-none rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 pr-10 focus:ring-2 focus:ring-offset-2 focus-visible:outline-none
        ${size === 'sm' && 'h-8 text-sm'}
        ${size === 'md' && 'h-10 text-base'}
        ${size === 'lg' && 'h-12 text-lg'}
        ${error && 'border-red-500 focus:ring-red-500'}`}
			on:change={handleChange}
			on:blur
			on:focus
		>
			{#each options as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>

		<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
			<svg
				class="text-muted-foreground h-4 w-4"
				xmlns="http://www.w3.org/2000/svg"
				fill="currentColor"
				viewBox="0 0 20 20"
			>
				<path
					fill-rule="evenodd"
					d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
	</div>

	{#if error && errorMessage}
		<p class="text-sm text-red-500">{errorMessage}</p>
	{:else if helperText}
		<p class="text-muted-foreground text-sm">{helperText}</p>
	{/if}
</div>
