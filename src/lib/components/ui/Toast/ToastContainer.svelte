<script lang="ts">
	import { toasts } from '$lib/stores/toastStore';
	import ToastItem from './ToastItem.svelte';
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col-reverse gap-2">
	{#each $toasts as toast (toast.id)}
		<ToastItem {toast} />
	{/each}
</div>
