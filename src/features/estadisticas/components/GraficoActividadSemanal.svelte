<!-- src/features/estadisticas/components/GraficoActividadSemanal.svelte -->
<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/Button.svelte';
	import type { ActividadSemanal } from '../api';

	export let data: ActividadSemanal[] | null = null;
	export let mes: number;
	export let anio: number;
	export let onMesChange: (mes: number) => void;
	export let onAnioChange: (anio: number) => void;
	export let className: string = '';

	let chartContainer: HTMLDivElement;
	let chartInstance: any = null;
	let echartsLibrary: any = null;
	let isChartReady = false;
	let tipoVista: 'plan' | 'semana' = 'plan';

	// Nombres de los meses para mostrar
	const nombresMeses = [
		'Enero',
		'Febrero',
		'Marzo',
		'Abril',
		'Mayo',
		'Junio',
		'Julio',
		'Agosto',
		'Septiembre',
		'Octubre',
		'Noviembre',
		'Diciembre'
	];

	// Años disponibles
	const aniosDisponibles = [2023, 2024, 2025];

	// Generar colores para cada actividad o semana
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
			console.log('No se puede crear el gráfico de actividad:', {
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

		let options: any;

		if (tipoVista === 'plan') {
			// Vista por plan (barras horizontales apiladas)
			const planNombres = data.map((item) => item.nombreActividad);
			const series = [1, 2, 3, 4].map((semana, index) => ({
				name: `Semana ${semana}`,
				type: 'bar',
				stack: 'total',
				label: {
					show: true,
					formatter: '{c}',
					fontSize: 10
				},
				emphasis: {
					focus: 'series'
				},
				itemStyle: {
					color: colores[index % colores.length]
				},
				data: data.map((item) => {
					const prop = `semana${semana}` as keyof typeof item;
					return item[prop] as number;
				})
			}));

			options = {
				title: {
					text: `Actividad por Plan - ${nombresMeses[mes]} ${anio}`,
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
						type: 'shadow'
					},
					formatter: function (params: any) {
						let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
						params.forEach((param: any) => {
							tooltip += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
						});
						return tooltip;
					}
				},
				legend: {
					data: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
					top: 35
				},
				grid: {
					left: '15%',
					right: '4%',
					bottom: '3%',
					top: 80,
					containLabel: true
				},
				xAxis: {
					type: 'value',
					axisLabel: {
						fontSize: 11
					}
				},
				yAxis: {
					type: 'category',
					data: planNombres,
					axisLabel: {
						fontSize: 11
					}
				},
				series: series
			};
		} else {
			// Vista por semana (barras agrupadas)
			const planes = data.map((item) => item.nombreActividad);

			options = {
				title: {
					text: `Actividad por Semana - ${nombresMeses[mes]} ${anio}`,
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
						type: 'shadow'
					},
					formatter: function (params: any) {
						let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
						params.forEach((param: any) => {
							tooltip += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
						});
						return tooltip;
					}
				},
				legend: {
					data: planes,
					top: 35,
					type: 'scroll'
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
					data: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
					axisLabel: {
						fontSize: 11
					}
				},
				yAxis: {
					type: 'value',
					axisLabel: {
						fontSize: 11
					}
				},
				series: planes.map((plan, index) => ({
					name: plan,
					type: 'bar',
					label: {
						show: true,
						formatter: '{c}',
						fontSize: 10
					},
					emphasis: {
						focus: 'series'
					},
					data: [
						data[index].semana1,
						data[index].semana2,
						data[index].semana3,
						data[index].semana4
					],
					itemStyle: {
						color: colores[index % colores.length]
					}
				}))
			};
		}

		options.responsive = true;

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

	// Reactivamente actualizar el gráfico cuando cambien los datos o la vista
	$: if (isChartReady && data && data.length > 0) {
		tick().then(() => {
			createChart();
		});
	}

	// Calcular totales por semana
	$: totalesPorSemana =
		data && data.length > 0
			? [0, 0, 0, 0].map((_, semanaIndex) => {
					return data.reduce((total, item) => {
						const prop = `semana${semanaIndex + 1}` as keyof typeof item;
						return total + (item[prop] as number);
					}, 0);
				})
			: [0, 0, 0, 0];

	// Calcular total general
	$: totalGeneral = totalesPorSemana.reduce((sum, total) => sum + total, 0);
</script>

<div class={`space-y-4 ${className}`}>
	<!-- Controles -->
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm font-medium text-[var(--letter)]">Vista:</span>
			<Button
				variant={tipoVista === 'plan' ? 'primary' : 'outline'}
				size="sm"
				on:click={() => (tipoVista = 'plan')}
			>
				Por Plan
			</Button>
			<Button
				variant={tipoVista === 'semana' ? 'primary' : 'outline'}
				size="sm"
				on:click={() => (tipoVista = 'semana')}
			>
				Por Semana
			</Button>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm font-medium text-[var(--letter)]">Mes:</span>
			<select
				class="rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 text-sm"
				bind:value={mes}
				on:change={(e) => {
					const target = e.target as HTMLSelectElement;
					onMesChange(parseInt(target.value));
				}}
			>
				{#each nombresMeses as nombre, index}
					<option value={index}>{nombre}</option>
				{/each}
			</select>

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
	{:else if data.length === 0}
		<div
			class="flex h-80 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--sections)] text-gray-500"
		>
			<p>No hay datos disponibles para este período</p>
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

		<!-- Resumen por semana -->
		<div class="grid grid-cols-2 gap-2 lg:grid-cols-5">
			{#each totalesPorSemana as total, index}
				<div class="rounded-lg border border-[var(--border)] bg-[var(--sections)] p-4 text-center">
					<p class="text-sm font-medium text-gray-600">Semana {index + 1}</p>
					<p class="text-xl font-bold text-[var(--primary)]">
						{total}
					</p>
					<p class="text-xs text-gray-500">inscripciones</p>
				</div>
			{/each}
			<div
				class="rounded-lg border border-[var(--border)] bg-[var(--primary)] p-4 text-center text-white"
			>
				<p class="text-sm font-medium">Total</p>
				<p class="text-xl font-bold">
					{totalGeneral}
				</p>
				<p class="text-xs opacity-80">inscripciones</p>
			</div>
		</div>
	{/if}
</div>
