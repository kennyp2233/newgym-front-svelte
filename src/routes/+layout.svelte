<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import ToastContainer from '$lib/components/ui/Toast/ToastContainer.svelte';

	let { children } = $props();
</script>

{@render children()}

<!-- Toast container global -->
<ToastContainer />
