<!-- src/features/estadisticas/components/GraficoTendenciaMensual.svelte -->
<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/Button.svelte';
	import type { TendenciaMensual } from '../api';

	export let data: TendenciaMensual | null = null;
	export let anio: number;
	export let onAnioChange: (anio: number) => void;
	export let className: string = '';

	let chartContainer: HTMLDivElement;
	let chartInstance: any = null;
	let echartsLibrary: any = null;
	let isChartReady = false;
	let mostrarSeries = { clientes: true, ingresos: true };

	// Años disponibles
	const aniosDisponibles = [2023, 2024, 2025];

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
			if (data) {
				createChart();
			}
		} catch (error) {
			console.error('Error al cargar ECharts:', error);
			isChartReady = false;
		}
	}

	function createChart() {
		if (!chartContainer || !echartsLibrary || !data) {
			console.log('No se puede crear el gráfico de tendencia:', {
				hasContainer: !!chartContainer,
				hasLibrary: !!echartsLibrary,
				hasData: !!data
			});
			return;
		}

		// Destruir gráfico anterior si existe
		if (chartInstance) {
			chartInstance.dispose();
		}

		// Inicializar el gráfico
		chartInstance = echartsLibrary.init(chartContainer);

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
				smooth: true
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
				smooth: true
			});
		}

		// Configurar las opciones del gráfico
		const options = {
			title: {
				text: `Tendencia Mensual ${anio}`,
				left: 'center',
				top: 10,
				textStyle: {
					fontSize: 16,
					fontWeight: 'bold',
					color: '#333'
				}
			},
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross',
					crossStyle: {
						color: '#999'
					}
				},
				formatter: function (params: any) {
					let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
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
				top: 35
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				top: 80,
				containLabel: true
			},
			xAxis: {
				type: 'category',
				data: data.meses,
				axisLabel: {
					interval: 0,
					rotate: 45,
					fontSize: 11
				},
				axisLine: {
					lineStyle: {
						color: '#ccc'
					}
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
						formatter: '{value}',
						color: '#8C3D87'
					},
					splitLine: {
						show: false
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
						formatter: '${value}',
						color: '#5BAE73'
					},
					splitLine: {
						show: false
					}
				}
			],
			series: series,
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
	}

	// Reactivamente actualizar el gráfico cuando cambien los datos o filtros
	$: if (isChartReady && data) {
		tick().then(() => {
			createChart();
		});
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
				totalIngresos: data.ingresos.reduce((sum, value) => sum + value, 0),
				promedioClientes: Math.round(
					data.clientes.reduce((sum, value) => sum + value, 0) / data.clientes.length
				),
				promedioIngresos: Math.round(
					data.ingresos.reduce((sum, value) => sum + value, 0) / data.ingresos.length
				)
			}
		: { totalClientes: 0, totalIngresos: 0, promedioClientes: 0, promedioIngresos: 0 };
</script>

<div class={`space-y-4 ${className}`}>
	<!-- Controles -->
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm font-medium text-[var(--letter)]">Mostrar:</span>
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
			<span class="text-sm font-medium text-[var(--letter)]">Año:</span>
			<select
				class="rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 text-sm"
				bind:value={anio}
				on:change={(e) => {
					const target = e.target as HTMLSelectElement;
					onAnioChange(parseInt(target.value));
				}}
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
			<div class="text-center">
				<div
					class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
				></div>
				<p>Cargando datos...</p>
			</div>
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

		<!-- Resumen de totales -->
		<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
					${totales.totalIngresos.toLocaleString()}
				</p>
				<p class="text-xs text-gray-500">en el periodo</p>
			</div>
			<div class="rounded-lg border border-[var(--border)] bg-blue-50 p-4 text-center">
				<p class="text-sm font-medium text-gray-600">Promedio Clientes</p>
				<p class="text-2xl font-bold text-blue-600">
					{totales.promedioClientes}
				</p>
				<p class="text-xs text-gray-500">por mes</p>
			</div>
			<div class="rounded-lg border border-[var(--border)] bg-yellow-50 p-4 text-center">
				<p class="text-sm font-medium text-gray-600">Promedio Ingresos</p>
				<p class="text-2xl font-bold text-yellow-600">
					${totales.promedioIngresos.toLocaleString()}
				</p>
				<p class="text-xs text-gray-500">por mes</p>
			</div>
		</div>
	{/if}
</div>
