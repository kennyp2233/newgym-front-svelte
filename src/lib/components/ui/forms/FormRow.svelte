<!-- src/lib/components/forms/FormRow.svelte -->
<script lang="ts">
	export let className: string = '';
</script>

<div class={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`}>
	<slot />
</div>
