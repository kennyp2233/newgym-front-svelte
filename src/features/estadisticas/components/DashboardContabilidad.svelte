<!-- src/features/estadisticas/components/DashboardContabilidad.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Panel from '$lib/components/ui/Panel.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { toasts } from '$lib/stores/toastStore';
	import { 
		estadisticas, 
		loading, 
		error, 
		resumenData, 
		distribucionData, 
		tendenciaData, 
		actividadData,
		anioSeleccionado,
		mesSeleccionado,
		initialized
	} from '../stores/estadisticasStore';
	import ResumenTarjetas from './ResumenTarjetas.svelte';
	import GraficoDistribucionMembresias from './GraficoDistribucionMembresias.svelte';
	import GraficoTendenciaMensual from './GraficoTendenciaMensual.svelte';
	import GraficoActividadSemanal from './GraficoActividadSemanal.svelte';
	import TablaInscripciones from './TablaInscripciones.svelte';

	let dashboardContainer: HTMLDivElement;
	let isGeneratingPDF = false;
	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		// Suscribirse al store y cargar datos solo si no están inicializados
		unsubscribe = initialized.subscribe((isInit) => {
			if (!isInit) {
				cargarDatosDashboard();
			}
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// Función separada para cargar datos con mejor manejo de errores
	async function cargarDatosDashboard() {
		try {
			await estadisticas.cargarDashboardCompleto();
			if ($error) {
				console.warn('Error en datos del dashboard, usando datos de prueba');
			}
		} catch (error) {
			console.error('Error al cargar dashboard:', error);
			toasts.showToast('Error al cargar los datos del dashboard, mostrando datos de prueba', 'warning');
		}
	}

	// Función para generar un informe PDF completo
	async function generarInformePDF() {
		if (!dashboardContainer || !browser) return;

		isGeneratingPDF = true;
		try {
			toasts.showToast('Generando informe PDF, esto puede tardar unos momentos...', 'info');

			// Importar dependencias dinámicamente
			const { jsPDF } = await import('jspdf');
			const html2canvas = await import('html2canvas');

			// Crear un PDF en formato A4
			const pdf = new jsPDF('p', 'mm', 'a4');

			// Agregar título y encabezado
			pdf.setFontSize(20);
			pdf.text('Informe de Contabilidad', 105, 15, { align: 'center' });
			pdf.setFontSize(12);
			pdf.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 105, 22, {
				align: 'center'
			});

			// Capturar cada sección del dashboard
			const secciones = dashboardContainer.querySelectorAll('.seccion-captura');

			let posicionY = 30;
			let pageNumber = 1;

			// Iterar por cada sección, capturarla y agregarla al PDF
			for (let i = 0; i < secciones.length; i++) {
				const seccion = secciones[i] as HTMLElement;

				try {
					// Configurar opciones de calidad para html2canvas
					const canvas = await html2canvas.default(seccion, {
						scale: 1.5, // Mayor escala para mejor calidad
						useCORS: true,
						logging: false,
						allowTaint: true,
						backgroundColor: '#ffffff'
					});

					const imgData = canvas.toDataURL('image/png');

					// Calcular dimensiones manteniendo proporción
					const imgWidth = 190; // Ancho fijo para A4 con márgenes
					const imgHeight = (canvas.height * imgWidth) / canvas.width;

					// Si la posición Y es demasiado grande, añadir una nueva página
					if (posicionY + imgHeight > 280) {
						pdf.addPage();
						posicionY = 15;
						pageNumber++;
					}

					// Añadir la imagen al PDF
					pdf.addImage(imgData, 'PNG', 10, posicionY, imgWidth, imgHeight);

					// Actualizar posición Y para la siguiente sección
					posicionY += imgHeight + 10;
				} catch (error) {
					console.error('Error al procesar sección:', error);
				}
			}

			// Agregar número de páginas a cada página
			const totalPages = pdf.getNumberOfPages();
			for (let i = 1; i <= totalPages; i++) {
				pdf.setPage(i);
				pdf.setFontSize(10);
				pdf.text(`Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
				pdf.text('Crossfit Tulcán - Sistema de Gestión', 105, 285, { align: 'center' });
			}

			// Guardar el PDF
			const fileName = `informe-contabilidad-${new Date().toISOString().split('T')[0]}.pdf`;
			pdf.save(fileName);

			toasts.showToast('Informe PDF generado correctamente', 'success');
		} catch (error) {
			console.error('Error al generar PDF:', error);
			toasts.showToast('Error al generar el informe PDF', 'error');
		} finally {
			isGeneratingPDF = false;
		}
	}

	// Handlers para cambios de filtros
	function handleAnioChange(anio: number) {
		estadisticas.setAnio(anio);
		estadisticas.cargarTendenciaMensual(anio);
		estadisticas.cargarActividadesSemanales(undefined, anio);
	}

	function handleMesChange(mes: number) {
		estadisticas.setMes(mes);
		estadisticas.cargarActividadesSemanales(mes);
	}

	function recargarDatos() {
		estadisticas.reset();
		cargarDatosDashboard();
	}

	// Estados reactivos del store
	$: isLoading = $loading;
	$: hasError = $error;
	$: resumeData = $resumenData;
	$: distributionData = $distribucionData;
	$: tendencyData = $tendenciaData;
	$: activityData = $actividadData;
	$: selectedAnio = $anioSeleccionado;
	$: selectedMes = $mesSeleccionado;
</script>

<div bind:this={dashboardContainer} class="space-y-6">
	<!-- Cabecera con título y botón de exportar -->
	<div class="flex flex-wrap items-center justify-between gap-4">
		<h1 class="text-2xl font-bold text-[var(--letter)]">Dashboard de Contabilidad</h1>
		<div class="flex gap-2">
			{#if hasError}
				<Button
					variant="outline"
					on:click={recargarDatos}
					leftIcon="refresh"
					size="sm"
				>
					Recargar
				</Button>
			{/if}
			<Button
				variant="primary"
				on:click={generarInformePDF}
				leftIcon="plus"
				isLoading={isGeneratingPDF}
				disabled={isGeneratingPDF}
			>
				{isGeneratingPDF ? 'Generando...' : 'Exportar Informe'}
			</Button>
		</div>
	</div>

	<!-- Mostrar indicador de carga general -->
	{#if isLoading && !$initialized}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent mx-auto"></div>
				<p class="text-lg font-medium text-[var(--letter)]">Cargando dashboard...</p>
				<p class="text-sm text-gray-500">Esto puede tardar unos momentos</p>
			</div>
		</div>
	{:else}
		<!-- Mostrar error si existe -->
		{#if hasError}
			<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-700">
				<div class="flex items-center justify-center gap-2 mb-2">
					<Icon name="warning" size={20} />
					<p class="font-medium">Algunos datos no se pudieron cargar</p>
				</div>
				<p class="text-sm">Se están mostrando datos de ejemplo. Verifique la conexión con el servidor.</p>
			</div>
		{/if}

		<!-- Tarjetas de resumen -->
		<div class="seccion-captura">
			<ResumenTarjetas data={resumeData} />
		</div>

		<!-- Grid responsive para gráficos -->
		<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
			<!-- Distribución de membresías -->
			<Panel
				title="Distribución de Membresías"
				titleIcon="dashboard"
				variant="purple"
				className="seccion-captura"
			>
				<GraficoDistribucionMembresias data={distributionData} />
			</Panel>

			<!-- Tendencia Mensual -->
			<Panel
				title="Tendencia Mensual"
				titleIcon="dashboard"
				variant="purple"
				className="seccion-captura"
			>
				<GraficoTendenciaMensual
					data={tendencyData}
					anio={selectedAnio}
					onAnioChange={handleAnioChange}
				/>
			</Panel>
		</div>

		<!-- Segunda fila de gráficos -->
		<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
			<!-- Actividad Semanal -->
			<Panel
				title="Actividad Semanal"
				titleIcon="dashboard"
				variant="purple"
				className="seccion-captura"
			>
				<GraficoActividadSemanal
					data={activityData}
					mes={selectedMes}
					anio={selectedAnio}
					onMesChange={handleMesChange}
					onAnioChange={handleAnioChange}
				/>
			</Panel>

			<!-- Tabla de inscripciones -->
			<Panel
				title="Detalle de Inscripciones"
				titleIcon="dashboard"
				variant="purple"
				className="seccion-captura"
			>
				<TablaInscripciones mes={selectedMes} anio={selectedAnio} />
			</Panel>
		</div>

		<!-- Información adicional -->
		<div class="seccion-captura">
			<Panel title="Información del Sistema" variant="default">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="rounded-lg bg-[var(--sections-hover)] p-4 text-center">
						<Icon name="dashboard" size={32} className="mx-auto mb-2 text-[var(--primary)]" />
						<h3 class="font-semibold">Dashboard</h3>
						<p class="text-sm text-gray-600">Estadísticas en tiempo real</p>
					</div>
					<div class="rounded-lg bg-[var(--sections-hover)] p-4 text-center">
						<Icon name="check" size={32} className="mx-auto mb-2 text-green-600" />
						<h3 class="font-semibold">Automatización</h3>
						<p class="text-sm text-gray-600">Reportes automáticos</p>
					</div>
					<div class="rounded-lg bg-[var(--sections-hover)] p-4 text-center">
						<Icon name="people" size={32} className="mx-auto mb-2 text-blue-600" />
						<h3 class="font-semibold">Gestión Integral</h3>
						<p class="text-sm text-gray-600">Control total del gimnasio</p>
					</div>
				</div>
			</Panel>
		</div>
	{/if}
</div>

<style>
	/* Estilos para mejorar la captura PDF */
	:global(.seccion-captura) {
		page-break-inside: avoid;
		margin-bottom: 20px;
	}

	:global(.seccion-captura:last-child) {
		margin-bottom: 0;
	}
</style>