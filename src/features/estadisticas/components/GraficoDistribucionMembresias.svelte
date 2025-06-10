<!-- src/features/estadisticas/components/GraficoDistribucionMembresias.svelte -->
<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { DistribucionMembresia } from '../api';

	export let data: DistribucionMembresia[] | null = null;
	export let className: string = '';

	let chartContainer: HTMLDivElement;
	let chartInstance: any = null;
	let echartsLibrary: any = null;
	let isChartReady = false;

	// Colores para los gráficos
	const colores = [
		'#8C3D87', // var(--primary)
		'#4A90E2', // var(--info)
		'#5BAE73', // var(--success)
		'#E7C46C', // var(--warning)
		'#E07A7A', // var(--error)
		'#AABBC4' // var(--secondary)
	];

	onMount(async () => {
		if (browser) {
			await initializeChart();
		}
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.dispose();
			chartInstance = null;
		}
	});

	async function initializeChart() {
		try {
			// Importar ECharts dinámicamente
			echartsLibrary = await import('echarts');
			isChartReady = true;

			// Esperar el siguiente tick para asegurar que el DOM esté listo
			await tick();

			// Crear gráfico si tenemos datos
			if (data && data.length > 0) {
				createChart();
			}
		} catch (error) {
			console.error('Error al cargar ECharts:', error);
			isChartReady = false;
		}
	}

	function createChart() {
		if (!chartContainer || !echartsLibrary || !data || data.length === 0) {
			console.log('No se puede crear el gráfico:', {
				hasContainer: !!chartContainer,
				hasLibrary: !!echartsLibrary,
				hasData: !!(data && data.length > 0)
			});
			return;
		}

		// Destruir gráfico anterior si existe
		if (chartInstance) {
			chartInstance.dispose();
		}

		// Inicializar el gráfico
		chartInstance = echartsLibrary.init(chartContainer);

		// Preparar los datos para el gráfico
		const seriesData = data.map((item, index) => ({
			value: item.cantidad,
			name: item.nombrePlan,
			itemStyle: {
				color: colores[index % colores.length]
			}
		}));

		// Configurar las opciones del gráfico
		const options = {
			title: {
				text: 'Distribución de Membresías',
				left: 'center',
				top: 10,
				textStyle: {
					fontSize: 16,
					fontWeight: 'bold',
					color: '#333'
				}
			},
			tooltip: {
				trigger: 'item',
				formatter: function (params: any) {
					return `${params.name}<br/>${params.value} clientes (${params.percent}%)`;
				}
			},
			legend: {
				type: 'scroll',
				orient: 'vertical',
				right: 20,
				top: 'middle',
				itemWidth: 14,
				itemHeight: 14,
				textStyle: {
					fontSize: 12
				}
			},
			series: [
				{
					name: 'Membresías',
					type: 'pie',
					radius: ['40%', '70%'],
					center: ['40%', '50%'],
					avoidLabelOverlap: true,
					itemStyle: {
						borderRadius: 8,
						borderColor: '#fff',
						borderWidth: 2
					},
					label: {
						show: true,
						position: 'outside',
						formatter: '{b}\n{d}%',
						fontSize: 11
					},
					emphasis: {
						itemStyle: {
							shadowBlur: 10,
							shadowOffsetX: 0,
							shadowColor: 'rgba(0, 0, 0, 0.5)'
						}
					},
					data: seriesData
				}
			],
			responsive: true
		};

		// Actualizar el gráfico
		chartInstance.setOption(options, true);

		// Manejar resize
		const handleResize = () => {
			if (chartInstance && !chartInstance.isDisposed()) {
				chartInstance.resize();
			}
		};

		window.addEventListener('resize', handleResize);

		// Cleanup function
		const cleanup = () => {
			window.removeEventListener('resize', handleResize);
		};

		return cleanup;
	}

	// Reactivamente actualizar el gráfico cuando cambien los datos
	$: if (isChartReady && data && data.length > 0) {
		tick().then(() => {
			createChart();
		});
	}

	// Calcular totales
	$: totalClientes = data ? data.reduce((sum, item) => sum + item.cantidad, 0) : 0;
</script>

<div class={`space-y-4 ${className}`}>
	{#if !data}
		<div
			class="flex h-80 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--sections)] text-gray-500"
		>
			<div class="text-center">
				<div
					class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
				></div>
				<p>Cargando datos...</p>
			</div>
		</div>
	{:else if data.length === 0}
		<div
			class="flex h-80 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--sections)] text-gray-500"
		>
			<p>No hay datos disponibles</p>
		</div>
	{:else}
		<!-- Gráfico -->
		<div class="rounded-lg border border-[var(--border)] bg-[var(--sections)] p-4">
			<div bind:this={chartContainer} class="h-80 w-full" style="min-height: 320px;">
				{#if !isChartReady}
					<div class="flex h-full items-center justify-center text-gray-500">
						<div class="text-center">
							<div
								class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
							></div>
							<p>Inicializando gráfico...</p>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Tabla con datos detallados -->
		<div class="overflow-x-auto">
			<table class="min-w-full rounded-lg border border-[var(--border)] bg-[var(--sections)]">
				<thead class="bg-[var(--sections-hover)]">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--letter)]"> Plan </th>
						<th class="px-4 py-3 text-center text-sm font-medium text-[var(--letter)]">
							Clientes
						</th>
						<th class="px-4 py-3 text-center text-sm font-medium text-[var(--letter)]">
							Porcentaje
						</th>
					</tr>
				</thead>
				<tbody>
					{#each data as item, index}
						<tr class="border-t border-[var(--border)] hover:bg-[var(--sections-hover)]">
							<td class="px-4 py-3 text-sm">
								<div class="flex items-center">
									<div
										class="mr-3 h-4 w-4 rounded-full"
										style="background-color: {colores[index % colores.length]}"
									></div>
									<span class="font-medium">{item.nombrePlan}</span>
								</div>
							</td>
							<td class="px-4 py-3 text-center text-sm font-semibold">
								{item.cantidad}
							</td>
							<td class="px-4 py-3 text-center text-sm font-semibold">
								{item.porcentaje.toFixed(1)}%
							</td>
						</tr>
					{/each}
					<tr class="border-t border-[var(--border)] bg-[var(--sections-hover)] font-bold">
						<td class="px-4 py-3 text-sm">Total</td>
						<td class="px-4 py-3 text-center text-sm">{totalClientes}</td>
						<td class="px-4 py-3 text-center text-sm">100.0%</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/if}
</div>
