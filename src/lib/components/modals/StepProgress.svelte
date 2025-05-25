<script lang="ts">
	export let currentStep: number = 0;
	export let totalSteps: number = 1;
</script>

<div class="h-2 w-full rounded-full bg-gray-200">
	<!-- svelte-ignore element_invalid_self_closing_tag -->
	<div
		class="h-2 rounded-full bg-[var(--primary)] transition-all"
		style="width: {((currentStep + 1) / totalSteps) * 100}%"
	/>
</div>
