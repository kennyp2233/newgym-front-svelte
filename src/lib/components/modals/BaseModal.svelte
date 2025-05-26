<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let isOpen: boolean = false;
	export let onClose: () => void = () => {};
	export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
	export let closeOnClickOutside: boolean = false;
	export let closeOnEsc: boolean = true;

	// Nuevas props
	/** Si es true, envuelve body+footer en un <form> */
	export let asForm: boolean = false;
	/** Handler de submit */
	export let onSubmit: (e: Event) => void = () => {};
	/** Pasa novalidate al form si quieres desactivar validación nativa */
	export let novalidate: boolean = false;

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-full mx-4'
	};

	let originalOverflow = '';

	function handleBackdropClick(event: MouseEvent) {
		if (closeOnClickOutside && event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (closeOnEsc && event.key === 'Escape') {
			onClose();
		}
	}

	onMount(() => {
		if (browser) {
			originalOverflow = document.body.style.overflow;
			if (isOpen) document.body.style.overflow = 'hidden';
			window.addEventListener('keydown', handleKeydown);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.body.style.overflow = originalOverflow;
			window.removeEventListener('keydown', handleKeydown);
		}
	});

	// Vigilar isOpen para scroll lock
	$: if (browser) {
		document.body.style.overflow = isOpen ? 'hidden' : originalOverflow;
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,#000_50%,transparent)] p-4"
		on:click={handleBackdropClick}
	>
		<div
			class={`relative flex w-full flex-col rounded-lg bg-[var(--sections)] shadow-lg ${sizeClasses[size]}`}
		>
			<!-- Header -->
			<header class="flex items-center justify-between border-b border-[var(--border)] px-5 py-2.5">
				<slot name="header" />
			</header>

			{#if asForm}
				<!-- Si necesitamos formulario, envolvemos body+footer -->
				<form class="flex flex-grow flex-col" on:submit|preventDefault={onSubmit} {novalidate}>
					<!-- Body -->
					<div class="max-h-[calc(80vh-8rem)] flex-grow overflow-y-auto bg-[var(--background)] p-4">
						<slot />
					</div>
					<!-- Footer dentro del formulario -->
					<footer class="flex justify-center border-t border-[var(--border)] p-4">
						<slot name="footer" />
					</footer>
				</form>
			{:else}
				<!-- Modal “estático”: content + footer separados -->
				<div class="max-h-[calc(80vh-8rem)] overflow-y-auto bg-[var(--background)] p-4">
					<slot />
				</div>
				<footer class="flex justify-center border-t border-[var(--border)] p-4">
					<slot name="footer" />
				</footer>
			{/if}
		</div>
	</div>
{/if}
