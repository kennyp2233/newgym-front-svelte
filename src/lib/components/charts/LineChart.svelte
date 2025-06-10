<!-- src/lib/components/charts/LineChart.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let data: any[] = [];
	export let xKey: string = 'x';
	export let yKey: string = 'y';
	export let color: string = '#8C3D87';
	export let title: string = '';
	export let className: string = '';

	let chartContainer: HTMLDivElement;
	let chartInstance: any = null;

	onMount(async () => {
		if (browser && data.length > 0) {
			// Importar Chart.js dinámicamente
			const { Chart, registerables } = await import('chart.js');
			Chart.register(...registerables);

			createChart(Chart);
		}
	});

	function createChart(ChartJS: any) {
		if (!chartContainer || !data.length) return;

		// Destruir gráfico anterior si existe
		if (chartInstance) {
			chartInstance.destroy();
		}

		const canvas = document.createElement('canvas');
		chartContainer.innerHTML = '';
		chartContainer.appendChild(canvas);

		const ctx = canvas.getContext('2d');

		chartInstance = new ChartJS(ctx, {
			type: 'line',
			data: {
				labels: data.map((item) => item[xKey]),
				datasets: [
					{
						label: title,
						data: data.map((item) => item[yKey]),
						borderColor: color,
						backgroundColor: color + '20',
						borderWidth: 2,
						fill: false,
						tension: 0.1,
						pointBackgroundColor: color,
						pointBorderColor: color,
						pointRadius: 4,
						pointHoverRadius: 6
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						mode: 'index',
						intersect: false
					}
				},
				scales: {
					x: {
						display: true,
						title: {
							display: true,
							text: 'Fecha'
						}
					},
					y: {
						display: true,
						title: {
							display: true,
							text: title
						}
					}
				},
				interaction: {
					mode: 'nearest',
					axis: 'x',
					intersect: false
				}
			}
		});
	}

	// Reactivamente actualizar el gráfico cuando cambien los datos
	$: if (browser && chartInstance && data.length > 0) {
		updateChart();
	}

	async function updateChart() {
		if (!chartInstance) return;

		chartInstance.data.labels = data.map((item) => item[xKey]);
		chartInstance.data.datasets[0].data = data.map((item) => item[yKey]);
		chartInstance.data.datasets[0].label = title;
		chartInstance.data.datasets[0].borderColor = color;
		chartInstance.data.datasets[0].backgroundColor = color + '20';
		chartInstance.data.datasets[0].pointBackgroundColor = color;
		chartInstance.data.datasets[0].pointBorderColor = color;

		chartInstance.update('none');
	}

	// Limpiar al destruir el componente
	$: if (!browser && chartInstance) {
		chartInstance.destroy();
		chartInstance = null;
	}
</script>

<div bind:this={chartContainer} class={`h-64 w-full ${className}`}>
	{#if !browser || data.length === 0}
		<div class="flex h-full items-center justify-center text-gray-500">
			{data.length === 0 ? 'No hay datos para mostrar' : 'Cargando gráfico...'}
		</div>
	{/if}
</div>
