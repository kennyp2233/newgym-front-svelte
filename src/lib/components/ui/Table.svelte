<script context="module" lang="ts">
	export interface Column<T> {
		key: string;
		header: any;
		render?: (value: any, item: T, idx: number) => any;
		sortable?: boolean;
		width?: string;
	}
</script>

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	export let data: any[] = [];
	export let columns: Column<any>[] = [];
	export let keyExtractor: (item: any) => string | number;
	export let className = '';
	export let onRowClick: (item: any) => void = () => {};

	// Helper to check if onRowClick is set to something other than the default no-op
	$: isRowClickable = onRowClick && onRowClick !== (() => {});
	export let isLoading = false;
	export let emptyStateMessage: any = 'No data available';
	export let pagination: {
		pageSize: number;
		currentPage: number;
		totalItems: number;
		onPageChange: (pg: number) => void;
	} | null = null;
	export let sorting: {
		column?: string;
		direction: 'asc' | 'desc';
		onSort: (col: string, dir: 'asc' | 'desc') => void;
	} | null = null;
	export let rowClassName: (item: any, idx: number) => string = () => '';
	export let actions: ((item: any) => any) | undefined = undefined;
	export let selectable = false;
	export let onSelectionChange: (selected: any[]) => void = () => {};

	const selected = writable<Set<string | number>>(new Set());

	// reset when data changes
	$: if (selectable) {
		selected.set(new Set());
		onSelectionChange?.([]);
	}
	function toggleRow(item: any, checked: boolean) {
		if (!item) return; // Safety check
		selected.update((s) => {
			const copy = new Set(s);
			const key = keyExtractor(item);
			checked ? copy.add(key) : copy.delete(key);
			onSelectionChange?.(data.filter((d) => d && copy.has(keyExtractor(d))));
			return copy;
		});
	}

	function toggleAll(checked: boolean) {
		selected.set(checked ? new Set(data.filter(d => d).map((d) => keyExtractor(d))) : new Set());
		onSelectionChange?.(checked ? [...data] : []);
	}

	$: totalPages = pagination ? Math.ceil(pagination.totalItems / pagination.pageSize) : 1;

	function pagesToShow() {
		if (!pagination) return [];
		const size = Math.min(5, totalPages);
		const arr = [];
		const cur = pagination.currentPage;
		const last = totalPages;
		for (let i = 0; i < size; i++) {
			let p = i + 1;
			if (cur > 3 && cur < last - 2) p = cur - 2 + i;
			else if (cur >= last - 2) p = last - size + 1 + i;
			if (p >= 1 && p <= last) arr.push(p);
		}
		return arr;
	}
</script>

{#if isLoading}
	<div class="flex w-full items-center justify-center py-10">
		<div
			class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
		></div>
	</div>
{:else if !data.length}
	<div class="flex w-full flex-col items-center justify-center py-10 text-center">
		<div class="text-lg font-medium text-gray-500">{emptyStateMessage}</div>
	</div>
{:else}
	<div class={`w-full overflow-x-auto ${className}`}>
		<table class="w-full border-collapse">
			<thead class="bg-[var(--sections-hover)] text-left">
				<tr>
					{#if selectable}
						<th class="border-b border-[var(--border)] p-3">
							<input
								type="checkbox"
								checked={$selected.size === data.length && data.length > 0}
								on:change={(e) => toggleAll(e.currentTarget.checked)}
								class="h-4 w-4 rounded border-gray-300"
							/>
						</th>
					{/if}

					{#each columns as col}
						<th
							class={`border-b border-[var(--border)] p-3 font-bold text-[var(--letter)]
                     ${col.sortable && 'cursor-pointer hover:bg-gray-100'}`}
							style={col.width ? `width:${col.width}` : ''}
							on:click={() => {
								if (col.sortable && sorting) {
									const dir =
										sorting.column === col.key && sorting.direction === 'asc' ? 'desc' : 'asc';
									sorting.onSort(col.key, dir);
								}
							}}
						>
							<div class="flex items-center space-x-1">
								<span>{@html typeof col.header === 'string' ? col.header : ''}</span>
								{#if col.sortable && sorting?.column === col.key}
									<span>{sorting.direction === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</div>
						</th>
					{/each}

					{#if actions}
						<th class="border-b border-[var(--border)] p-3 text-right">Actions</th>
					{/if}
				</tr>
			</thead>			<tbody>
				{#each data.filter(item => item) as item, i (keyExtractor(item))}
					<tr
						class={`${isRowClickable ? 'cursor-pointer hover:bg-gray-50' : ''} ${rowClassName(item, i)}`}
						on:click={() => onRowClick?.(item)}
					>
						{#if selectable}
							<td class="border-b border-[var(--border)] p-3" on:click|stopPropagation>
								<input
									type="checkbox"
									checked={$selected.has(keyExtractor(item))}
									on:change={(e) => toggleRow(item, e.currentTarget.checked)}
									class="h-4 w-4 rounded border-gray-300"
								/>
							</td>
						{/if}

						{#each columns as col}
							<td
								class="max-w-0 truncate border-b border-[var(--border)] p-3 text-[var(--letter)]"
								title={col.render ? `${col.render(item[col.key], item, i)}` : `${item[col.key]}`}
							>
								{#if col.render}
									{@html col.render(item[col.key], item, i)}
								{:else}
									{item[col.key]}
								{/if}
							</td>
						{/each}

						{#if actions}
							<td class="border-b border-[var(--border)] p-3 text-right" on:click|stopPropagation>
								<svelte:component this={actions(item)} />
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>

		{#if pagination && pagination.totalItems > 0}
			<div class="mt-4 flex items-center justify-between">
				<div class="text-sm text-gray-500">
					Showing {(pagination.currentPage - 1) * pagination.pageSize + 1}
					to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
					of {pagination.totalItems} entries
				</div>
				<div class="flex space-x-1">
					<Button
						size="sm"
						variant="outline"
						on:click={() => pagination.onPageChange(pagination.currentPage - 1)}
						disabled={pagination.currentPage === 1}
					>
						Previous
					</Button>
					{#each pagesToShow() as pg}
						<Button
							size="sm"
							variant={pagination.currentPage === pg ? 'primary' : 'outline'}
							on:click={() => pagination.onPageChange(pg)}
						>
							{pg}
						</Button>
					{/each}
					<Button
						size="sm"
						variant="outline"
						on:click={() => pagination.onPageChange(pagination.currentPage + 1)}
						disabled={pagination.currentPage === totalPages}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
{/if}
