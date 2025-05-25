<!-- src/features/clientes/components/MedidasHistoricas.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import { medidaService, type Medida } from '../../../medidas/api';
	import { toasts } from '$lib/stores/toastStore';
	import { formatDate } from '$lib/utils';

	export let idCliente: number;

	let medidas: Medida[] = [];
	let isLoading = true;
	let metricaSeleccionada = 'peso';

	// Cargar medidas del cliente
	onMount(async () => {
		await fetchMedidas();
	});

	async function fetchMedidas() {
		isLoading = true;
		try {
			const data = await medidaService.getMedidasByCliente(idCliente);
			// Ordenar por fecha (más reciente primero)
			medidas = data.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);
		} catch (error) {
			console.error('Error al cargar medidas:', error);
			toasts.showToast('Error al cargar el historial de medidas', 'error');
		} finally {
			isLoading = false;
		}
	}

	// Preparar datos para la gráfica (más antiguo primero)
	$: chartData = [...medidas].reverse().map((medida) => ({
		fecha: formatDate(medida.createdAt),
		peso: medida.peso,
		altura: medida.altura,
		brazos: medida.brazos,
		pantorrillas: medida.pantorrillas,
		gluteo: medida.gluteo,
		muslos: medida.muslos,
		pecho: medida.pecho,
		cintura: medida.cintura,
		cuello: medida.cuello,
		imc: medida.imc
	}));

	// Configuración de métricas disponibles
	const metricas = [
		{ key: 'peso', label: 'Peso (kg)', color: '#8C3D87' },
		{ key: 'altura', label: 'Altura (cm)', color: '#4A90E2' },
		{ key: 'brazos', label: 'Brazos (cm)', color: '#5BAE73' },
		{ key: 'pantorrillas', label: 'Pantorrillas (cm)', color: '#E7C46C' },
		{ key: 'gluteo', label: 'Glúteo (cm)', color: '#E07A7A' },
		{ key: 'muslos', label: 'Muslos (cm)', color: '#CC6666' },
		{ key: 'pecho', label: 'Pecho (cm)', color: '#732F6F' },
		{ key: 'cintura', label: 'Cintura (cm)', color: '#D1AD5A' },
		{ key: 'cuello', label: 'Cuello (cm)', color: '#C3D0DB' },
		{ key: 'imc', label: 'IMC', color: '#3777C6' }
	];

	$: metricaActual = metricas.find((m) => m.key === metricaSeleccionada);

	// Columnas para la tabla
	const columns = [
		{
			key: 'fecha',
			header: 'Fecha',
			render: (_: any, medida: Medida) => formatDate(medida.createdAt)
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
			header: 'Categoría'
		},
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
	];
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
					<Button
						variant="ghost"
						size="sm"
						className={`rounded-full ${
							metricaSeleccionada === metrica.key
								? 'bg-[var(--primary)] text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
						on:click={() => (metricaSeleccionada = metrica.key)}
					>
						{metrica.label}
					</Button>
				{/each}
			</div>

			<!-- Gráfico -->
			<LineChart
				data={chartData}
				xKey="fecha"
				yKey={metricaSeleccionada}
				color={metricaActual?.color || '#8C3D87'}
				title={metricaActual?.label || ''}
			/>
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
		/>
	</div>
</div>
