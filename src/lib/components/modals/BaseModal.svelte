<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let isOpen: boolean = false;
	export let onClose: () => void = () => {};
	export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';	export let closeOnClickOutside: boolean = false;
	export let closeOnEsc: boolean = true;
	export let showCloseButton: boolean = true;

	// Props de formulario
	export let asForm: boolean = false;
	export let onSubmit: (e: Event) => void = () => {};
	export let novalidate: boolean = false;

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-full mx-4'
	};

	let originalOverflow = '';
	let wasOpen = false;

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

	// Función para controlar el scroll
	function lockScroll() {
		if (browser && !wasOpen) {
			originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			wasOpen = true;
		}
	}

	function unlockScroll() {
		if (browser && wasOpen) {
			document.body.style.overflow = originalOverflow;
			wasOpen = false;
		}
	}

	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', handleKeydown);

			// Si el modal ya está abierto al montar, bloquear scroll
			if (isOpen) {
				lockScroll();
			}
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleKeydown);
			// Asegurar que el scroll se desbloquee al destruir el componente
			unlockScroll();
		}
	});

	// Reactivo: controlar scroll basado en isOpen
	$: if (browser) {
		if (isOpen) {
			lockScroll();
		} else {
			unlockScroll();
		}
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
		>			<!-- Header -->
			<header class="flex items-center justify-between border-b border-[var(--border)] px-5 py-2.5">
				<slot name="header" />
				{#if showCloseButton}
					<button
						type="button"
						class="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-300 cursor-pointer"
						on:click={onClose}
						aria-label="Cerrar modal"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				{/if}
			</header>

			{#if asForm}
				<!-- Si necesitamos formulario, envolvemos body+footer -->
				<form class="flex flex-grow flex-col" on:submit|preventDefault={onSubmit} {novalidate}>
					<!-- Body -->
					<div class="max-h-[calc(80vh-8rem)] flex-grow overflow-y-auto bg-[var(--background)] p-4">
						<slot />
					</div>
					<!-- Footer dentro del formulario -->
					<footer class="flex justify-center gap-2 border-t border-[var(--border)] p-4">
						<slot name="footer" />
					</footer>
				</form>
			{:else}
				<!-- Modal "estático": content + footer separados -->
				<div class="max-h-[calc(80vh-8rem)] overflow-y-auto bg-[var(--background)] p-4">
					<slot />
				</div>
				<footer class="flex justify-center gap-2 border-t border-[var(--border)] p-4">
					<slot name="footer" />
				</footer>
			{/if}
		</div>
	</div>
{/if}
