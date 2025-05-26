<!-- src/features/estadisticas/components/GraficoActividadSemanal.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
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
		'#E7C46C' // var(--warning)
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

		let options: any;

		if (tipoVista === 'plan') {
			// Vista por plan (barras horizontales apiladas)
			const planNombres = data.map((item) => item.nombreActividad);
			const series = [1, 2, 3, 4].map((semana) => ({
				name: `Semana ${semana}`,
				type: 'bar',
				stack: 'total',
				label: {
					show: true,
					formatter: '{c}'
				},
				emphasis: {
					focus: 'series'
				},
				data: data.map((item) => {
					const prop = `semana${semana}` as keyof typeof item;
					return item[prop] as number;
				})
			}));

			options = {
				title: {
					text: `Actividad Semanal - ${nombresMeses[mes]} ${anio}`,
					left: 'center',
					textStyle: {
						fontSize: 16,
						fontWeight: 'bold'
					}
				},
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'shadow'
					}
				},
				legend: {
					data: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
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
					type: 'value'
				},
				yAxis: {
					type: 'category',
					data: planNombres
				},
				series: series,
				color: colores
			};
		} else {
			// Vista por semana (barras agrupadas)
			const planes = data.map((item) => item.nombreActividad);

			options = {
				title: {
					text: `Actividad Semanal - ${nombresMeses[mes]} ${anio}`,
					left: 'center',
					textStyle: {
						fontSize: 16,
						fontWeight: 'bold'
					}
				},
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'shadow'
					}
				},
				legend: {
					data: planes,
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
					data: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']
				},
				yAxis: {
					type: 'value'
				},
				series: planes.map((plan, index) => ({
					name: plan,
					type: 'bar',
					label: {
						show: true,
						formatter: '{c}'
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
				})),
				color: colores
			};
		}

		options.toolbox = {
			feature: {
				saveAsImage: {
					title: 'Guardar imagen',
					pixelRatio: 2
				}
			},
			right: 20,
			top: 25
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

	// Reactivamente actualizar el gráfico cuando cambien los datos o la vista
	$: if (browser && chartInstance && data && data.length > 0) {
		updateChart();
	}

	async function updateChart() {
		if (!chartInstance || !data) return;

		// Recrear el gráfico para cambios en el tipo de vista
		const echarts = await import('echarts');
		createChart(echarts);
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
</script>

<div class={`space-y-4 ${className}`}>
	<!-- Controles -->
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm font-medium">Vista:</span>
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
			<span class="text-sm font-medium">Mes:</span>
			<select
				class="rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-1"
				bind:value={mes}
				on:change={(e) => {
					const target = e.target as HTMLSelectElement | null;
					if (target) onMesChange(parseInt(target.value));
				}}
			>
				{#each nombresMeses as nombre, index}
					<option value={index}>{nombre}</option>
				{/each}
			</select>

			<span class="text-sm font-medium">Año:</span>
			<select
				class="rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-1"
				bind:value={anio}
				on:change={(e) => {
					const target = e.target as HTMLSelectElement | null;
					if (target) onAnioChange(parseInt(target.value));
				}}
			>
				{#each aniosDisponibles as year}
					<option value={year}>{year}</option>
				{/each}
			</select>
		</div>
	</div>

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

		<!-- Resumen por semana -->
		<div class="grid grid-cols-4 gap-2">
			{#each totalesPorSemana as total, index}
				<div class="rounded-lg border border-[var(--border)] bg-[var(--sections)] p-4 text-center">
					<p class="text-sm font-medium text-gray-600">Semana {index + 1}</p>
					<p class="text-xl font-bold text-[var(--primary)]">
						{total}
					</p>
					<p class="text-xs text-gray-500">inscripciones</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
