<script lang="ts">
	import { toasts, type Toast } from '$lib/stores/toastStore';

	export let toast: Toast;

	const typeStyles = {
		success: 'bg-[var(--success)] text-white',
		error: 'bg-[var(--warning-error)] text-white',
		warning: 'bg-[var(--warning)] text-white',
		info: 'bg-[var(--info)] text-white'
	};

	function close() {
		toasts.hideToast(toast.id);
	}
</script>

<div
	class={`flex w-full max-w-sm transform overflow-hidden rounded-md shadow-lg transition-all duration-300 ease-in-out ${typeStyles[toast.type]}`}
	role="alert"
>
	<div class="flex w-full items-center p-4">
		<div class="mr-3 flex-shrink-0">
			{#if toast.type === 'success'}
				<!-- ícono success -->
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			{:else if toast.type === 'error'}
				<!-- ícono error -->
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			{:else if toast.type === 'warning'}
				<!-- ícono warning -->
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01M4.93 19h14.14a1 1 0 0 0 .86-1.5L13.86 4.5a1 1 0 0 0-1.72 0L4.07 17.5A1 1 0 0 0 4.93 19z"
					/>
				</svg>
			{:else}
				<!-- ícono info -->
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"
					/>
				</svg>
			{/if}
		</div>
		<div class="flex-1 pr-3">
			<p class="text-sm font-medium">{toast.message}</p>
		</div>
		<!-- svelte-ignore a11y_consider_explicit_label -->
		<button
			on:click={close}
			class="hover:bg-opacity-10 flex-shrink-0 rounded p-1 hover:bg-black focus:outline-none"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	</div>
</div>
