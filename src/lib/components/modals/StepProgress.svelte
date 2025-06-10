<script lang="ts">
	export let currentStep: number = 0;
	export let totalSteps: number = 1;
	export let stepLabels: string[] = [];

	// Generate default step labels if not provided
	$: labels =
		stepLabels.length > 0
			? stepLabels
			: Array.from({ length: totalSteps }, (_, i) => `Paso ${i + 1}`);
</script>

<div class="w-full py-4">
	<div class="flex items-center justify-between">
		{#each labels as label, index}
			<div class="flex flex-1 flex-col items-center">
				<!-- Step circle -->
				<div class="flex w-full items-center">
					<!-- Connection line (before) -->
					{#if index > 0}
						<div
							class="h-1 flex-1 {index <= currentStep
								? 'bg-[var(--primary)]'
								: 'bg-gray-300'} transition-colors duration-300"
						></div>
					{/if}

					<!-- Step indicator -->
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 {index <
						currentStep
							? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-lg'
							: index === currentStep
								? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-lg scale-110'
								: 'border-gray-300 bg-white text-gray-400'}"
					>
						{#if index < currentStep}
							<!-- Checkmark for completed steps -->
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M5 13l4 4L19 7"
								></path>
							</svg>
						{:else}
							<!-- Step number -->
							<span class="text-sm font-bold">{index + 1}</span>
						{/if}
					</div>

					<!-- Connection line (after) -->
					{#if index < totalSteps - 1}
						<div
							class="h-1 flex-1 {index < currentStep
								? 'bg-[var(--primary)]'
								: 'bg-gray-300'} transition-colors duration-300"
						></div>
					{/if}
				</div>

				<!-- Step label -->
				<div
					class="mt-3 text-center text-sm transition-colors duration-300 {index <= currentStep
						? 'font-semibold text-[var(--primary)]'
						: 'text-gray-500'} {index === currentStep ? 'font-bold' : ''}"
				>
					{label}
				</div>
			</div>
		{/each}
	</div>
</div>
