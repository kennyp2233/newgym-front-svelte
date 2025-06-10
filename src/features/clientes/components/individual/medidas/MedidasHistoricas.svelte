<!-- src/features/clientes/components/individual/medidas/MedidasHistoricas.svelte -->
<script lang="ts">	import { onMount } from 'svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import { createMedidasListStore, medidaUtils, type Medida } from '../../../../medidas/composables/medidaComposables';
	import type { Cliente } from '../../../api';
	import { TipoOcupacion } from '../../../api';
	import MedidaDetailModal from './MedidaDetailModal.svelte';
	import type { TableAction } from '$lib/components/ui/Table.svelte';
	export let clienteId: number;
	export let cliente: Cliente;
	export let onUpdate: () => void = () => {};
	export let key: number = 0; // Para forzar re-render desde el padre

	// Crear el store de medidas para este cliente
	const medidasStore = createMedidasListStore(clienteId);
	const { medidas, isLoading, cargarMedidas } = medidasStore;
	let metricaSeleccionada = 'peso';
	let showDetailModal = false;
	let selectedMedida: Medida | null = null;

	const esNino = cliente.ocupacion === TipoOcupacion.NINO;
	// Métricas disponibles usando el composable
	$: metricas = medidaUtils.getMetricasDisponibles(esNino);
	// Cargar medidas cuando cambie el cliente o la key
	$: if (clienteId && key !== undefined) {
		cargarMedidas();
	}

	onMount(async () => {
		await cargarMedidas();
	});
	// Detectar automáticamente la métrica con datos disponibles si la actual no tiene datos
	$: if ($medidas.length > 0 && metricaSeleccionada) {
		const hasData = $medidas.some(
			(medida) => medida[metricaSeleccionada as keyof Medida] != null
		);
		if (!hasData) {
			const firstAvailableMetric = metricas.find((m) =>
				$medidas.some((medida) => medida[m.key as keyof Medida] != null)
			);
			if (firstAvailableMetric) {
				metricaSeleccionada = firstAvailableMetric.key;
			}
		}
	}
	// Preparar datos para la gráfica usando el composable
	$: chartData = medidaUtils.getChartData($medidas, metricaSeleccionada);
	
	// Key único para forzar re-render del gráfico
	$: chartKey = `chart-${metricaSeleccionada}-${$medidas.length}-${JSON.stringify(chartData.slice(0, 2))}-${key}`;

	$: metricaActual = metricas.find((m) => m.key === metricaSeleccionada);

	// ✅ NUEVA FUNCIÓN PARA MANEJAR VER MEDIDA
	function handleViewMedida(medida: Medida) {
		selectedMedida = medida;
		showDetailModal = true;
	}
	function handleDetailSuccess() {
		showDetailModal = false;
		selectedMedida = null;
		cargarMedidas();
		onUpdate();
	}

	function handleMetricChange(metricKey: string) {
		metricaSeleccionada = metricKey;
	}

	// ✅ CONFIGURACIÓN DE ACCIONES PARA LA TABLA
	$: tableActions = [
		{
			label: 'Ver',
			icon: 'search',
			variant: 'outline' as const,
			onClick: handleViewMedida
		}
	] as TableAction<Medida>[];

	// Configuración de columnas para la tabla
	$: columns = [		{
			key: 'fecha',
			header: 'Fecha',
			render: (value: any, medida: Medida) => medidaUtils.formatDate(medida.createdAt)
		},
		{
			key: 'peso',
			header: 'Peso (kg)',
			render: (value: number) => Number(value)?.toFixed(1) || '-'
		},
		{
			key: 'altura',
			header: 'Altura (cm)',
			render: (value: number) => Number(value)?.toFixed(1) || '-'
		},
		{
			key: 'imc',
			header: 'IMC',
			render: (value: number) => Number(value)?.toFixed(2) || '-'
		},
		{
			key: 'categoriaPeso',
			header: 'Categoría',
			render: (value: string) => value || '-'
		},
		...(esNino
			? []
			: [
					{
						key: 'brazos',
						header: 'Brazos (cm)',
						render: (value: number) => Number(value)?.toFixed(1) || '-'
					},
					{
						key: 'pecho',
						header: 'Pecho (cm)',
						render: (value: number) => Number(value)?.toFixed(1) || '-'
					},
					{
						key: 'cintura',
						header: 'Cintura (cm)',
						render: (value: number) => Number(value)?.toFixed(1) || '-'
					}
				])
	];
</script>

<div class="space-y-6">
	<!-- Gráfico de evolución -->
	<div class="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-xl font-bold text-[var(--letter)]">Evolución de Medidas</h2>

		{#if $isLoading}
			<div class="flex h-64 items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
				></div>
			</div>
		{:else if $medidas.length === 0}
			<div class="flex h-64 items-center justify-center text-gray-500">
				No hay medidas registradas para este cliente.
			</div>
		{:else}
			<!-- Selector de métricas -->
			<div class="mb-4 flex flex-wrap gap-2">				{#each metricas as metrica}
					{@const hasData = $medidas.some((m) => m[metrica.key as keyof Medida] != null)}
					<Button
						variant="ghost"
						size="sm"
						disabled={!hasData}
						className={`rounded-full ${
							metricaSeleccionada === metrica.key
								? 'bg-[var(--primary)] text-white'
								: hasData
									? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									: 'bg-gray-50 text-gray-400 cursor-not-allowed'
						}`}
						on:click={() => hasData && handleMetricChange(metrica.key)}
					>
						{metrica.label}
						{#if !hasData}
							<span class="ml-1 text-xs">(Sin datos)</span>
						{/if}
					</Button>
				{/each}
			</div>

			<!-- Información sobre datos disponibles -->
			{#if chartData.length === 0}
				<div class="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
					<p class="text-sm text-yellow-700">
						No hay suficientes datos para mostrar el gráfico de <strong
							>{metricaActual?.label}</strong
						>. Selecciona otra métrica o agrega más medidas.
					</p>
				</div>
			{:else}
				<div class="mb-2 text-sm text-gray-600">
					Mostrando {chartData.length} registro{chartData.length !== 1 ? 's' : ''} de
					<strong>{metricaActual?.label}</strong>
				</div>
			{/if}			<!-- Gráfico -->
			{#if chartData.length > 0}
				{#key chartKey}
					<LineChart
						data={chartData}
						xKey="fecha"
						yKey={metricaSeleccionada}
						color={metricaActual?.color || '#8C3D87'}
						title={metricaActual?.label || ''}
					/>
				{/key}
			{:else}
				<div class="flex h-64 items-center justify-center text-gray-400">
					<div class="text-center">
						<p class="text-lg">📊</p>
						<p>Gráfico no disponible</p>
						<p class="text-sm">Selecciona una métrica con datos</p>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Tabla con historial -->
	<div class="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-xl font-bold text-[var(--letter)]">Historial de Medidas</h2>

		<!-- ✅ TABLA CORREGIDA CON SISTEMA DE ACCIONES -->		<Table
			data={$medidas}
			{columns}
			actions={tableActions}
			keyExtractor={(item) => item.idMedida.toString()}
			isLoading={$isLoading}
			emptyStateMessage="No hay medidas registradas para este cliente"
			rowClassName={() => 'bg-[var(--sections)] hover:bg-[var(--sections-hover)]'}
			className="rounded-lg overflow-hidden"
		/>
	</div>
</div>

<!-- Modal para ver/editar medida -->
{#if showDetailModal && selectedMedida}
	<MedidaDetailModal
		isOpen={showDetailModal}
		{cliente}
		medida={selectedMedida}
		onClose={() => {
			showDetailModal = false;
			selectedMedida = null;
		}}
		onSuccess={handleDetailSuccess}
	/>
{/if}
