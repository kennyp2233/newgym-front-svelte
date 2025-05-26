<!-- src/features/estadisticas/components/GraficoDistribucionMembresias.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { DistribucionMembresia } from '../api';

	export let data: DistribucionMembresia[] | null = null;
	export let className: string = '';

	let chartContainer: HTMLDivElement;
	let chartInstance: any = null;

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
		if (browser && data && data.length > 0) {
			try {
				// Importar ECharts dinámicamente
				const echarts = await import('echarts');
				createChart(echarts);
			} catch (error) {
				console.error('Error al cargar ECharts:', error);
			}
		}
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.dispose();
			chartInstance = null;
		}
	});

	function createChart(echarts: any) {
		if (!chartContainer || !data || data.length === 0) return;

		// Destruir gráfico anterior si existe
		if (chartInstance) {
			chartInstance.dispose();
		}

		// Inicializar el gráfico
		chartInstance = echarts.init(chartContainer);

		// Preparar los datos para el gráfico
		const seriesData = data.map((item, index) => ({
			value: item.cantidad,
			name: `${item.nombrePlan} (${item.porcentaje}%)`,
			itemStyle: {
				color: colores[index % colores.length]
			}
		}));

		// Configurar las opciones del gráfico
		const options = {
			title: {
				text: 'Distribución de Membresías',
				left: 'center',
				textStyle: {
					fontSize: 16,
					fontWeight: 'bold'
				}
			},
			tooltip: {
				trigger: 'item',
				formatter: '{a} <br/>{b}: {c} ({d}%)'
			},
			legend: {
				type: 'scroll',
				orient: 'vertical',
				right: 10,
				top: 'middle',
				formatter: (name: string) => {
					// Extraer solo el nombre del plan (sin el porcentaje)
					return name.split(' (')[0];
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
						borderRadius: 10,
						borderColor: '#fff',
						borderWidth: 2
					},
					label: {
						show: false,
						position: 'center'
					},
					emphasis: {
						label: {
							show: true,
							fontSize: 16,
							fontWeight: 'bold'
						}
					},
					labelLine: {
						show: false
					},
					data: seriesData
				}
			],
			toolbox: {
				feature: {
					saveAsImage: {
						title: 'Guardar imagen',
						pixelRatio: 2
					}
				},
				right: 15,
				top: 15
			}
		};

		// Actualizar el gráfico
		chartInstance.setOption(options);

		// Función para manejar el resize
		const handleResize = () => {
			if (chartInstance) {
				chartInstance.resize();
			}
		};

		window.addEventListener('resize', handleResize);

		// Limpiar event listener al destruir
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}

	// Reactivamente actualizar el gráfico cuando cambien los datos
	$: if (browser && chartInstance && data && data.length > 0) {
		updateChart();
	}

	async function updateChart() {
		if (!chartInstance || !data) return;

		const seriesData = data.map((item, index) => ({
			value: item.cantidad,
			name: `${item.nombrePlan} (${item.porcentaje}%)`,
			itemStyle: {
				color: colores[index % colores.length]
			}
		}));

		chartInstance.setOption({
			series: [
				{
					data: seriesData
				}
			]
		});
	}
</script>

<div class={`space-y-4 ${className}`}>
	{#if !data || data.length === 0}
		<div
			class="flex h-80 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--sections)] text-gray-500"
		>
			{data === null ? 'Cargando datos...' : 'No hay datos disponibles'}
		</div>
	{:else}
		<!-- Gráfico -->
		<div
			bind:this={chartContainer}
			class="h-80 w-full rounded-lg border border-[var(--border)] bg-[var(--sections)]"
		>
			{#if !browser}
				<div class="flex h-full items-center justify-center text-gray-500">Cargando gráfico...</div>
			{/if}
		</div>

		<!-- Tabla con datos detallados -->
		<div class="overflow-x-auto">
			<table class="min-w-full rounded-lg border border-[var(--border)] bg-[var(--sections)]">
				<thead class="bg-[var(--sections-hover)]">
					<tr>
						<th class="px-4 py-2 text-left text-sm font-medium text-[var(--letter)]"> Plan </th>
						<th class="px-4 py-2 text-center text-sm font-medium text-[var(--letter)]">
							Clientes
						</th>
						<th class="px-4 py-2 text-center text-sm font-medium text-[var(--letter)]">
							Porcentaje
						</th>
					</tr>
				</thead>
				<tbody>
					{#each data as item, index}
						<tr class="border-t border-[var(--border)]">
							<td class="px-4 py-2 text-sm">
								<div class="flex items-center">
									<div
										class="mr-2 h-3 w-3 rounded-full"
										style="background-color: {colores[index % colores.length]}"
									></div>
									{item.nombrePlan}
								</div>
							</td>
							<td class="px-4 py-2 text-center text-sm font-medium">
								{item.cantidad}
							</td>
							<td class="px-4 py-2 text-center text-sm font-medium">
								{item.porcentaje}%
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
