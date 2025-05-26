<!-- src/features/clientes/components/individual/medidas/MedidasHistoricas.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import { medidaService, type Medida } from '../../../../medidas/api';
	import { toasts } from '$lib/stores/toastStore';
	import { formatDate } from '$lib/utils';
	import type { Cliente } from '../../../api';
	import { TipoOcupacion } from '../../../api';
	import MedidaDetailModal from './MedidaDetailModal.svelte';

	export let clienteId: number;
	export let cliente: Cliente;
	export let onUpdate: () => void = () => {};
	export let key: number = 0; // Para forzar re-render desde el padre

	let medidas: Medida[] = [];
	let isLoading = true;
	let metricaSeleccionada = 'peso';
	let showDetailModal = false;
	let selectedMedida: Medida | null = null;

	const esNino = cliente.ocupacion === TipoOcupacion.NINO;

	// Métricas disponibles
	$: metricas = [
		{ key: 'peso', label: 'Peso (kg)', color: '#8C3D87' },
		{ key: 'altura', label: 'Altura (cm)', color: '#4A90E2' },
		{ key: 'imc', label: 'IMC', color: '#3777C6' },
		...(esNino
			? []
			: [
					{ key: 'brazos', label: 'Brazos (cm)', color: '#5BAE73' },
					{ key: 'pantorrillas', label: 'Pantorrillas (cm)', color: '#E7C46C' },
					{ key: 'gluteo', label: 'Glúteo (cm)', color: '#E07A7A' },
					{ key: 'muslos', label: 'Muslos (cm)', color: '#CC6666' },
					{ key: 'pecho', label: 'Pecho (cm)', color: '#732F6F' },
					{ key: 'cintura', label: 'Cintura (cm)', color: '#D1AD5A' }
				])
	];

	// Cargar medidas cuando cambie el cliente o la key
	$: if (clienteId && key !== undefined) {
		fetchMedidas();
	}

	onMount(async () => {
		await fetchMedidas();
	});

	async function fetchMedidas() {
		if (!clienteId) return;

		isLoading = true;
		try {
			const data = await medidaService.getMedidasByCliente(clienteId);
			medidas = data.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);

			// Si no hay datos para la métrica seleccionada, cambiar a la primera disponible
			if (medidas.length > 0 && metricaSeleccionada) {
				const hasData = medidas.some(
					(medida) => medida[metricaSeleccionada as keyof Medida] != null
				);
				if (!hasData) {
					const firstAvailableMetric = metricas.find((m) =>
						medidas.some((medida) => medida[m.key as keyof Medida] != null)
					);
					if (firstAvailableMetric) {
						metricaSeleccionada = firstAvailableMetric.key;
					}
				}
			}
		} catch (error) {
			console.error('Error al cargar medidas:', error);
			toasts.showToast('Error al cargar el historial de medidas', 'error');
		} finally {
			isLoading = false;
		}
	}

	// Preparar datos para la gráfica de forma reactiva
	$: chartData = [...medidas]
		.reverse()
		.map((medida, index) => ({
			fecha: formatDate(medida.createdAt),
			fechaIndex: index, // Para asegurar orden en el gráfico
			peso: medida.peso || null,
			altura: medida.altura || null,
			brazos: medida.brazos || null,
			pantorrillas: medida.pantorrillas || null,
			gluteo: medida.gluteo || null,
			muslos: medida.muslos || null,
			pecho: medida.pecho || null,
			cintura: medida.cintura || null,
			cuello: medida.cuello || null,
			imc: medida.imc || null
		}))
		.filter((data) => data[metricaSeleccionada as keyof typeof data] != null); // Solo datos con valor

	$: metricaActual = metricas.find((m) => m.key === metricaSeleccionada);

	// Configuración de columnas para la tabla
	$: columns = [
		{
			key: 'fecha',
			header: 'Fecha',
			render: (value: any, medida: Medida) => formatDate(medida.createdAt)
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
				]),
		{
			key: 'acciones',
			header: 'Acciones',
			render: (value: any, medida: Medida) => `
        <button class="btn-view" data-id="${medida.idMedida}">
          Ver
        </button>
      `
		}
	];

	// Manejar clic en ver medida
	function handleTableClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.classList.contains('btn-view')) {
			const medidaId = parseInt(target.dataset.id || '');
			const medida = medidas.find((m) => m.idMedida === medidaId);
			if (medida) {
				selectedMedida = medida;
				showDetailModal = true;
			}
		}
	}

	function handleDetailSuccess() {
		showDetailModal = false;
		selectedMedida = null;
		fetchMedidas();
		onUpdate();
	}

	function handleMetricChange(metricKey: string) {
		metricaSeleccionada = metricKey;
	}
</script>

<div class="space-y-6">
	<!-- Gráfico de evolución -->
	<div class="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-xl font-bold text-[var(--letter)]">Evolución de Medidas</h2>

		{#if isLoading}
			<div class="flex h-64 items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
				></div>
			</div>
		{:else if medidas.length === 0}
			<div class="flex h-64 items-center justify-center text-gray-500">
				No hay medidas registradas para este cliente.
			</div>
		{:else}
			<!-- Selector de métricas -->
			<div class="mb-4 flex flex-wrap gap-2">
				{#each metricas as metrica}
					{@const hasData = medidas.some((m) => m[metrica.key as keyof Medida] != null)}
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
			{/if}

			<!-- Gráfico -->
			{#if chartData.length > 0}
				{#key `${metricaSeleccionada}-${medidas.length}-${key}`}
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

		<Table
			data={medidas}
			{columns}
			keyExtractor={(item) => item.idMedida.toString()}
			{isLoading}
			emptyStateMessage="No hay medidas registradas para este cliente"
			rowClassName={() => 'bg-[var(--sections)] hover:bg-[var(--sections-hover)]'}
			className="rounded-lg overflow-hidden"
			on:click={handleTableClick}
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

<style>
	:global(.btn-view) {
		cursor: pointer;
		border-radius: 0.25rem;
		background-color: #e0e7ff;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		color: #3730a3;
		transition: background-color 0.15s ease-in-out;
		margin-right: 0.5rem;
	}

	:global(.btn-view:hover) {
		background-color: #c7d2fe;
	}
</style>
