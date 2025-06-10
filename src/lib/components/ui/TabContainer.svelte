<script context="module" lang="ts">
	export interface TabConfig {
		key: string;
		label: string;
		leftIcon?: string;
		rightIcon?: string;
		badge?: string | number;
		props?: Record<string, any>;
	}
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { TabItem } from '$lib/components/ui/Panel.svelte';

	export let tabs: TabConfig[] = [];
	export let activeTab: string = '';
	export let components: Record<string, any> = {};

	const dispatch = createEventDispatcher<{
		tabChange: { tab: string };
		update: void;
	}>();

	// Convertir tabs a formato Panel con componentes
	$: panelTabs = tabs.map((tab) => ({
		key: tab.key,
		label: tab.label,
		leftIcon: tab.leftIcon,
		component: components[tab.key],
		props: tab.props || {}
	})) satisfies TabItem[];

	// Escuchar cambios de tab
	$: if (activeTab) {
		dispatch('tabChange', { tab: activeTab });
	}
</script>

<!-- Panel con tabs - Solo mostrar si hay tabs -->
{#if tabs.length > 0}
	<Panel 
		tabs={panelTabs} 
		defaultActiveTab={activeTab || tabs[0]?.key} 
		variant="clean" 
		bind:activeTab
	>
		<svelte:fragment slot="header-actions" let:activeTab>
			<slot name="tab-actions" {activeTab} />
		</svelte:fragment>
	</Panel>
{:else}
	<div class="text-center py-8 text-gray-500">
		<Icon name="info" size={24} className="mx-auto mb-2" />
		<p>No hay pestañas disponibles</p>
	</div>
{/if}
