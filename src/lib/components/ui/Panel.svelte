<script context="module" lang="ts">
	export interface TabItem {
		key: string;
		label: string;
		content: any; // componente o fragmento
		actions?: any; // componente o fragmento
		leftIcon?: any; // SVG o componente
	}
</script>

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { onMount } from 'svelte';

	export let title: string = '';
	export let actionLabel: string = '';
	export let actionIcon: any = null;
	export let onAction: () => void = () => {};
	export let className: string = '';
	export let variant: 'default' | 'purple' = 'default';
	export let titleIcon: any = null;
	export let tabs: TabItem[] = [];
	export let defaultActiveTab: string = '';
	export let actions: any = null;
	export let showActions: boolean = true;

	let activeTab: string;

	onMount(() => {
		activeTab = defaultActiveTab || (tabs[0]?.key ?? '');
	});

	$: activeTabItem = tabs.find((t) => t.key === activeTab);

	$: actionsToRender = activeTabItem?.actions ? activeTabItem.actions : actions ? actions : null;
</script>

<div class={`rounded-lg border border-[var(--border)] bg-[var(--sections)] shadow-sm ${className}`}>
	{#if title || tabs.length}
		<div
			class={`flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--sections-hover)] px-5 py-2.5
        ${variant === 'purple' ? 'text-[var(--primary)]' : ''}`}
		>
			{#if title}
				<h2
					class={`flex items-center gap-3 text-xl font-bold
            ${variant === 'purple' ? 'text-[var(--primary)]' : 'text-[var(--letter)]'}`}
				>
					{#if titleIcon}<svelte:component this={titleIcon} />{/if}
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

			<div class="ml-auto flex items-center gap-2">
				{#if actionsToRender}
					{@html typeof actionsToRender === 'string' ? actionsToRender : ''}
					{#if typeof actionsToRender !== 'string'}
						<svelte:component this={actionsToRender} />
					{/if}
				{/if}
			</div>
		</div>
	{/if}

	<div class="p-5">
		<div class="ml-auto flex items-center gap-2">
			{#if actionsToRender}
				{@html typeof actionsToRender === 'string' ? actionsToRender : ''}
				{#if typeof actionsToRender !== 'string'}
					<svelte:component this={actionsToRender} />
				{/if}
			{:else if onAction && actionLabel && showActions}
				<Button variant="outline" size="sm" on:click={onAction} leftIcon={actionIcon}>
					{actionLabel}
				</Button>
			{/if}
		</div>
		{#if activeTabItem && activeTabItem.content !== undefined}
			{#if typeof activeTabItem.content === 'string'}
				{@html activeTabItem.content}
			{:else}
				<svelte:component this={activeTabItem.content} />
			{/if}
		{:else}
			<slot />
		{/if}
	</div>
</div>
