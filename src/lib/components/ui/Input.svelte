<script lang="ts">
	export let label = '';
	export let helperText = '';
	export let errorMessage = '';
	export let type = 'text';
	export let error = false;
	export let leftIcon: any = null;
	export let rightIcon: any = null;
	export let unit: string | null = null;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let value = '';
	export let id = '';
	export let name = '';
	export let placeholder = '';
</script>

<div class="w-full space-y-1.5">
	{#if label}
		<label for={id} class="text-md font-bold text-[var(--letter)]">{label}</label>
	{/if}

	<div class="relative flex items-center">
		{#if leftIcon}
			<div class="text-muted-foreground absolute left-3">{@html leftIcon}</div>
		{/if}

		<input
			{id}
			{name}
			bind:value
			{type}
			{placeholder}
			class={`w-full rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 focus:ring-2 focus:ring-offset-2
        ${leftIcon ? 'pl-10' : ''} ${rightIcon || unit ? 'pr-14' : ''}
        ${size === 'sm' && 'h-8 text-sm'}
        ${size === 'md' && 'h-10 text-base'}
        ${size === 'lg' && 'h-12 text-lg'}
        ${error && 'border-red-500 focus:ring-red-500'}`}
		/>

		{#if rightIcon || unit}
			<div class="text-muted-foreground absolute right-2 flex h-full items-center border-l px-3">
				{#if unit}
					<span class="text-sm">{unit}</span>
				{:else}
					{@html rightIcon}
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
