<!-- src/features/estadisticas/components/GraficoTendenciaMensual.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/Button.svelte';
	import type { TendenciaMensual } from '../api';

	export let data: TendenciaMensual | null = null;
	export let anio: number;
	export let onAnioChange: (anio: number) => void;
	export let className: string = '';

	let chartContainer: HTMLDivElement;
	let chartInstance: any = null;
	let mostrarSeries = { clientes: true, ingresos: true };

	// Años disponibles
	const aniosDisponibles = [2023, 2024, 2025];

	onMount(async () => {
		if (browser && data) {
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
		if (!chartContainer || !data) return;

		// Destruir gráfico anterior si existe
		if (chartInstance) {
			chartInstance.dispose();
		}

		// Inicializar el gráfico
		chartInstance = echarts.init(chartContainer);

		// Preparar series según qué mostrar
		const series = [];

		if (mostrarSeries.clientes) {
			series.push({
				name: 'Clientes',
				type: 'line',
				data: data.clientes,
				yAxisIndex: 0,
				symbol: 'circle',
				symbolSize: 8,
				itemStyle: {
					color: '#8C3D87' // var(--primary)
				},
				lineStyle: {
					width: 3,
					color: '#8C3D87'
				},
				areaStyle: null
			});
		}

		if (mostrarSeries.ingresos) {
			series.push({
				name: 'Ingresos ($)',
				type: 'line',
				data: data.ingresos,
				yAxisIndex: 1,
				symbol: 'circle',
				symbolSize: 8,
				itemStyle: {
					color: '#5BAE73' // var(--success)
				},
				lineStyle: {
					width: 3,
					color: '#5BAE73'
				},
				areaStyle: null
			});
		}

		// Configurar las opciones del gráfico
		const options = {
			title: {
				text: `Tendencia Mensual ${anio}`,
				left: 'center',
				textStyle: {
					fontSize: 16,
					fontWeight: 'bold'
				}
			},
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross'
				},
				formatter: function (params: any) {
					let tooltip = params[0].axisValue + '<br/>';
					params.forEach((param: any) => {
						if (param.seriesName === 'Ingresos ($)') {
							tooltip += `${param.marker} ${param.seriesName}: $${param.value}<br/>`;
						} else {
							tooltip += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
						}
					});
					return tooltip;
				}
			},
			legend: {
				data: ['Clientes', 'Ingresos ($)'],
				selected: {
					Clientes: mostrarSeries.clientes,
					'Ingresos ($)': mostrarSeries.ingresos
				},
				top: 30
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				top: '80',
				containLabel: true
			},
			xAxis: {
				type: 'category',
				data: data.meses,
				axisLabel: {
					interval: 0,
					rotate: 45
				}
			},
			yAxis: [
				{
					type: 'value',
					name: 'Clientes',
					position: 'left',
					show: mostrarSeries.clientes,
					axisLine: {
						show: true,
						lineStyle: {
							color: '#8C3D87'
						}
					},
					axisLabel: {
						formatter: '{value}'
					}
				},
				{
					type: 'value',
					name: 'Ingresos ($)',
					position: 'right',
					show: mostrarSeries.ingresos,
					axisLine: {
						show: true,
						lineStyle: {
							color: '#5BAE73'
						}
					},
					axisLabel: {
						formatter: '${value}'
					}
				}
			],
			series: series,
			toolbox: {
				feature: {
					dataZoom: {
						yAxisIndex: 'none'
					},
					saveAsImage: {
						title: 'Guardar imagen',
						pixelRatio: 2
					}
				},
				right: 20,
				top: 25
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

	// Reactivamente actualizar el gráfico cuando cambien los datos o filtros
	$: if (browser && chartInstance && data) {
		updateChart();
	}

	async function updateChart() {
		if (!chartInstance || !data) return;

		// Recrear el gráfico para cambios en las series
		const echarts = await import('echarts');
		createChart(echarts);
	}

	function toggleSeries(tipo: 'clientes' | 'ingresos') {
		mostrarSeries = {
			...mostrarSeries,
			[tipo]: !mostrarSeries[tipo]
		};
	}

	// Calcular totales para el resumen
	$: totales = data
		? {
				totalClientes: data.clientes.reduce((sum, value) => sum + value, 0),
				totalIngresos: data.ingresos.reduce((sum, value) => sum + value, 0)
			}
		: { totalClientes: 0, totalIngresos: 0 };
</script>

<div class={`space-y-4 ${className}`}>
	<!-- Controles -->
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm font-medium">Mostrar:</span>
			<Button
				variant={mostrarSeries.clientes ? 'primary' : 'outline'}
				size="sm"
				on:click={() => toggleSeries('clientes')}
			>
				Clientes
			</Button>
			<Button
				variant={mostrarSeries.ingresos ? 'success' : 'outline'}
				size="sm"
				on:click={() => toggleSeries('ingresos')}
			>
				Ingresos
			</Button>
		</div>

		<div class="flex items-center gap-2">
			<span class="text-sm font-medium">Año:</span>
			<select
				class="rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-1"
				bind:value={anio}
				on:change={(e) => onAnioChange(parseInt(e.target.value))}
			>
				{#each aniosDisponibles as year}
					<option value={year}>{year}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if !data}
		<div
			class="flex h-80 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--sections)] text-gray-500"
		>
			Cargando datos...
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

		<!-- Resumen de totales -->
		<div class="grid grid-cols-2 gap-4">
			<div class="rounded-lg border border-[var(--border)] bg-purple-50 p-4 text-center">
				<p class="text-sm font-medium text-gray-600">Total Clientes</p>
				<p class="text-2xl font-bold text-[var(--primary)]">
					{totales.totalClientes}
				</p>
				<p class="text-xs text-gray-500">nuevas inscripciones</p>
			</div>
			<div class="rounded-lg border border-[var(--border)] bg-green-50 p-4 text-center">
				<p class="text-sm font-medium text-gray-600">Total Ingresos</p>
				<p class="text-2xl font-bold text-[var(--success)]">
					${totales.totalIngresos}
				</p>
				<p class="text-xs text-gray-500">en el periodo</p>
			</div>
		</div>
	{/if}
</div>
