<!-- src/lib/components/ui/Panel.svelte -->
<script context="module" lang="ts">
	export interface TabItem {
		key: string;
		label: string;
		component?: any; // Componente Svelte
		leftIcon?: string;
		props?: Record<string, any>; // Props para pasar al componente
	}
</script>

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { onMount, afterUpdate } from 'svelte';

	export let title: string = '';
	export let className: string = '';
	export let variant: 'default' | 'purple' = 'default';
	export let titleIcon: string | null = null;

	// Tabs
	export let tabs: TabItem[] = [];
	export let defaultActiveTab: string = '';

	let activeTab: string = '';
	let mounted = false;

	// Reactivo: actualizar activeTab cuando cambien los tabs o defaultActiveTab
	$: if (mounted && tabs.length > 0) {
		// Si el tab activo no existe en los nuevos tabs, usar el defaultActiveTab o el primero
		const tabExists = tabs.some((t) => t.key === activeTab);
		if (!tabExists) {
			activeTab = defaultActiveTab || tabs[0]?.key || '';
		}
	}

	$: activeTabItem = tabs.find((t) => t.key === activeTab);

	onMount(() => {
		activeTab = defaultActiveTab || (tabs[0]?.key ?? '');
		mounted = true;
	});

	afterUpdate(() => {
		// Verificar que el tab activo sigue siendo válido después de updates
		if (tabs.length > 0 && !tabs.some((t) => t.key === activeTab)) {
			activeTab = defaultActiveTab || tabs[0]?.key || '';
		}
	});

	function handleTabClick(tabKey: string) {
		activeTab = tabKey;
	}
</script>

<div class={`rounded-lg border border-[var(--border)] bg-[var(--sections)] shadow-sm ${className}`}>
	{#if title || tabs.length > 0}
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
						<Icon name={titleIcon} size={20} />
					{/if}
					{title}
				</h2>
			{/if}

			{#if tabs.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each tabs as tab (tab.key)}
						<Button
							variant="ghost"
							size="sm"
							className={`${
								activeTab === tab.key
									? 'bg-[var(--primary)] text-white'
									: 'text-[var(--letter)] hover:bg-[var(--sections)]'
							}`}
							leftIcon={tab.leftIcon}
							on:click={() => handleTabClick(tab.key)}
						>
							{tab.label}
						</Button>
					{/each}
				</div>
			{/if}

			<!-- Slot para acciones en cabecera - solo si no hay tabs -->
			{#if tabs.length === 0}
				<div class="ml-auto flex items-center gap-2">
					<slot name="header-actions" />
				</div>
			{/if}
		</div>
	{/if}

	<!-- CUERPO -->
	<div class="p-5">
		{#if tabs.length > 0}
			<!-- Mostrar acciones específicas del tab activo -->
			<div class="mb-4 flex justify-end">
				<slot name="tab-actions" {activeTab} />
			</div>

			<!-- Contenido del tab activo -->
			{#if activeTabItem?.component}
				{#key `${activeTabItem.key}-${activeTabItem.props?.key || 0}`}
					<svelte:component this={activeTabItem.component} {...activeTabItem.props || {}} />
				{/key}
			{:else}
				<!-- Slot content for active tab -->
				<slot name="tab-content" {activeTab} />
			{/if}
		{:else}
			<!-- Acciones para panel sin tabs -->
			<div class="mb-4 flex justify-end">
				<slot name="actions" />
			</div>

			<!-- Contenido por defecto -->
			<slot />
		{/if}
	</div>
</div>
