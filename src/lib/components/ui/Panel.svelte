<!-- src/lib/components/ui/Panel.svelte -->
<script context="module" lang="ts">
	// Define la forma de tus tabs y los slots que vas a exponer
	export interface TabItem {
		key: string;
		label: string;
		content: any; // Componente o fragmento
		actions?: any; // Componente o fragmento
		leftIcon?: any; // string con nombre de ícono
	}
</script>

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { onMount } from 'svelte';

	export let title: string = '';
	export let actionLabel: string = '';
	export let actionIcon: any = null;
	export let onAction: () => void = () => {};
	export let className: string = '';
	export let variant: 'default' | 'purple' = 'default';

	// Ahora titleIcon es un string con el nombre
	export let titleIcon: string | null = null;

	// Props originales de acciones por prop
	export let actions: any = null;

	// Tabs
	export let tabs: TabItem[] = [];
	export let defaultActiveTab: string = '';

	let activeTab: string;

	onMount(() => {
		activeTab = defaultActiveTab || (tabs[0]?.key ?? '');
	});

	$: activeTabItem = tabs.find((t) => t.key === activeTab);
	// Fallback a prop.actions o tabs[].actions
	$: actionsToRender = activeTabItem?.actions ? activeTabItem.actions : actions ? actions : null;
</script>

<div class={`rounded-lg border border-[var(--border)] bg-[var(--sections)] shadow-sm ${className}`}>
	{#if title || tabs.length}
		<!-- CABECERA -->
		<div
			class={`flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--sections-hover)] px-5 py-2.5
        ${variant === 'purple' ? 'text-[var(--primary)]' : ''}`}
		>
			{#if title}
				<h2
					class={`flex items-center gap-3 text-xl font-bold
            ${variant === 'purple' ? 'text-[var(--primary)]' : 'text-[var(--letter)]'}`}
				>
					{#if titleIcon}
						<!-- Ahora usamos siempre el <Icon /> -->
						<Icon name={titleIcon} size={20} />
					{/if}
					{title}
				</h2>
			{/if}

			{#if tabs.length}
				<div class="flex flex-wrap gap-2">
					{#each tabs as tab}
						<Button
							variant="ghost"
							className={`${
								activeTab === tab.key
									? 'text-[var(--primary)]'
									: 'text-[var(--letter)] hover:bg-[var(--sections)]'
							}`}
							leftIcon={tab.leftIcon}
							on:click={() => (activeTab = tab.key)}
						>
							{tab.label}
						</Button>
					{/each}
				</div>
			{/if}

			<!-- Slot nombrado "actions" en cabecera -->
			<div class="ml-auto flex items-center gap-2">
				<slot name="actions">
					{#if actionsToRender}
						{@html typeof actionsToRender === 'string' ? actionsToRender : ''}
						{#if typeof actionsToRender !== 'string'}
							<svelte:component this={actionsToRender} />
						{/if}
					{/if}
				</slot>
			</div>
		</div>
	{/if}

	<!-- CUERPO -->
	<div class="p-5">
		<!-- Slot nombrado "actions" también dentro del cuerpo -->
		<div class="ml-auto flex items-center gap-2">
			<slot name="actions">
				{#if actionsToRender}
					{@html typeof actionsToRender === 'string' ? actionsToRender : ''}
					{#if typeof actionsToRender !== 'string'}
						<svelte:component this={actionsToRender} />
					{/if}
				{:else if onAction && actionLabel}
					<Button variant="outline" size="sm" on:click={onAction} leftIcon={actionIcon}>
						{actionLabel}
					</Button>
				{/if}
			</slot>
		</div>

		{#if activeTabItem && activeTabItem.content !== undefined}
			{#if typeof activeTabItem.content === 'string'}
				{@html activeTabItem.content}
			{:else}
				<svelte:component this={activeTabItem.content} />
			{/if}
		{:else}
			<!-- Slot por defecto para contenido sin tabs -->
			<slot />
		{/if}
	</div>
</div>
