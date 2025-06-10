<!-- src/features/estadisticas/components/TablaInscripciones.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { api } from '$lib/services/api';
	import { toasts } from '$lib/stores/toastStore';

	export let mes: number = new Date().getMonth();
	export let anio: number = new Date().getFullYear();
	export let className: string = '';

	// Interfaz para clientes con inscripciones
	interface ClienteInscripcion {
		idCliente: number;
		nombre: string;
		apellido: string;
		cedula: string;
		inscripciones: Array<{
			idInscripcion: number;
			fechaInicio: string;
			fechaFin: string;
			plan: {
				nombre: string;
				precio: number;
				duracionMeses: number;
			};
		}>;
	}

	// Estados reactivos
	let clientes: ClienteInscripcion[] = [];
	let filteredClientes: ClienteInscripcion[] = [];
	let isLoading = true;
	let busqueda = '';
	let periodoActual = { mes, anio };

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

	onMount(() => {
		cargarInscripciones(mes, anio);
	});

	// Cargar inscripciones del período
	async function cargarInscripciones(mes: number, anio: number) {
		if (!browser) return;

		isLoading = true;
		try {
			// Obtener el primer y último día del mes seleccionado
			const primerDia = new Date(anio, mes, 1).toISOString().split('T')[0];
			const ultimoDia = new Date(anio, mes + 1, 0).toISOString().split('T')[0];

			// Obtener inscripciones filtradas por fecha
			const response = await api.get(
				`/clientes?inscripcionDesde=${primerDia}&inscripcionHasta=${ultimoDia}`
			);

			// Filtrar clientes que tengan inscripciones en el período
			const clientesConInscripciones = response.data.filter(
				(cliente: ClienteInscripcion) => cliente.inscripciones && cliente.inscripciones.length > 0
			);

			clientes = clientesConInscripciones;
			filteredClientes = clientesConInscripciones;
			periodoActual = { mes, anio };
		} catch (error) {
			console.error('Error al cargar inscripciones:', error);
			toasts.showToast('Error al cargar las inscripciones', 'error');
		} finally {
			isLoading = false;
		}
	}

	// Filtrar clientes por búsqueda
	$: {
		if (!busqueda.trim()) {
			filteredClientes = clientes;
		} else {
			const busquedaLower = busqueda.toLowerCase();
			filteredClientes = clientes.filter(
				(cliente) =>
					cliente.nombre.toLowerCase().includes(busquedaLower) ||
					cliente.apellido.toLowerCase().includes(busquedaLower) ||
					cliente.cedula.includes(busqueda)
			);
		}
	}

	// Calcular totales
	$: totales = (() => {
		let totalInscripciones = 0;
		let totalIngresos = 0;

		filteredClientes.forEach((cliente) => {
			cliente.inscripciones.forEach((inscripcion) => {
				totalInscripciones++;
				totalIngresos += parseFloat(inscripcion.plan.precio.toString());
			});
		});

		return { totalInscripciones, totalIngresos };
	})();

	// Exportar a PDF (simulado - requiere jsPDF)
	async function exportarPDF() {
		try {
			// Importar jsPDF dinámicamente
			const { jsPDF } = await import('jspdf');
			const { default: autoTable } = await import('jspdf-autotable');

			const doc = new jsPDF();

			// Título
			doc.setFontSize(18);
			doc.text(
				`Informe de Inscripciones - ${nombresMeses[periodoActual.mes]} ${periodoActual.anio}`,
				105,
				15,
				{ align: 'center' }
			);

			// Subtítulo
			doc.setFontSize(12);
			doc.text(`Generado el ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

			// Totales generales
			doc.setFontSize(12);
			doc.text(`Total Inscripciones: ${totales.totalInscripciones}`, 15, 35);
			doc.text(`Total Ingresos: ${Number(totales.totalIngresos).toFixed(2)}`, 15, 42);

			// Tabla de inscripciones
			const tableColumn = ['Cliente', 'Cédula', 'Plan', 'Fecha Inicio', 'Fecha Fin', 'Valor'];
			const tableRows: any[] = [];

			filteredClientes.forEach((cliente) => {
				const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`;

				cliente.inscripciones.forEach((inscripcion) => {
					const row = [
						nombreCompleto,
						cliente.cedula,
						inscripcion.plan.nombre,
						new Date(inscripcion.fechaInicio).toLocaleDateString(),
						new Date(inscripcion.fechaFin).toLocaleDateString(),
						`${Number(inscripcion.plan.precio).toFixed(2)}`
					];

					tableRows.push(row);
				});
			});

			(autoTable as any)(doc, {
				head: [tableColumn],
				body: tableRows,
				startY: 50,
				styles: { fontSize: 10, cellPadding: 3 },
				columnStyles: { 5: { halign: 'right' } } // Alinear precios a la derecha
			});

			// Agregar pie de página
			const finalY = (doc as any).lastAutoTable.finalY || 50;
			doc.setFontSize(10);
			doc.text('Crossfit Tulcán - Sistema de Gestión de Gimnasio', 105, finalY + 10, {
				align: 'center'
			});
			doc.text(`Página 1 de 1`, 105, finalY + 15, { align: 'center' });

			// Guardar PDF
			doc.save(`Inscripciones-${nombresMeses[periodoActual.mes]}-${periodoActual.anio}.pdf`);
			toasts.showToast('Informe exportado correctamente', 'success');
		} catch (error) {
			console.error('Error al exportar PDF:', error);
			toasts.showToast('Error al exportar el informe', 'error');
		}
	}

	// Cambiar período
	function cambiarPeriodo(nuevoMes: number, nuevoAnio: number) {
		if (nuevoMes !== periodoActual.mes || nuevoAnio !== periodoActual.anio) {
			cargarInscripciones(nuevoMes, nuevoAnio);
		}
	}

	// Formatear fecha
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

<div class={`space-y-4 ${className}`}>
	<!-- Controles -->
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-2">
			<Input
				placeholder="Buscar cliente o cédula..."
				bind:value={busqueda}
				leftIcon="search"
				className="w-64"
			/>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm font-medium">Mes:</span>
			<select
				class="rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-1"
				bind:value={periodoActual.mes}
				on:change={(e) => {
					const target = e.target as HTMLSelectElement | null;
					if (target) cambiarPeriodo(parseInt(target.value), periodoActual.anio);
				}}
			>
				{#each nombresMeses as nombre, index}
					<option value={index}>{nombre}</option>
				{/each}
			</select>

			<span class="text-sm font-medium">Año:</span>
			<select
				class="rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-1"
				bind:value={periodoActual.anio}
				on:change={(e) => {
					const target = e.target as HTMLSelectElement | null;
					if (target) cambiarPeriodo(periodoActual.mes, parseInt(target.value));
				}}
			>
				{#each aniosDisponibles as year}
					<option value={year}>{year}</option>
				{/each}
			</select>

			<Button variant="primary" size="sm" leftIcon="plus" on:click={exportarPDF}>
				Exportar PDF
			</Button>
		</div>
	</div>

	<!-- Panel principal -->
	<div class="rounded-lg border border-[var(--border)] bg-[var(--sections)] p-4 shadow-sm">
		<h3 class="mb-4 text-lg font-semibold">
			Inscripciones - {nombresMeses[periodoActual.mes]}
			{periodoActual.anio}
		</h3>

		<!-- Tarjetas de resumen -->
		<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="rounded-lg bg-[var(--sections-hover)] p-4">
				<p class="text-sm text-gray-600">Total Inscripciones</p>
				<p class="text-2xl font-bold text-[var(--primary)]">{totales.totalInscripciones}</p>
			</div>
			<div class="rounded-lg bg-[var(--sections-hover)] p-4">
				<p class="text-sm text-gray-600">Total Ingresos</p>
				<p class="text-2xl font-bold text-green-600">${Number(totales.totalIngresos).toFixed(2)}</p>
			</div>
		</div>

		<!-- Tabla -->
		{#if isLoading}
			<div class="flex justify-center py-8">
				<div
					class="h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"
				></div>
			</div>
		{:else if filteredClientes.length === 0}
			<div class="py-8 text-center">
				<p class="text-gray-500">No hay inscripciones para el período seleccionado.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="min-w-full overflow-hidden rounded-lg bg-white">
					<thead class="bg-[var(--sections-hover)] text-[var(--letter)]">
						<tr>
							<th class="px-4 py-3 text-left font-semibold">Cliente</th>
							<th class="px-4 py-3 text-left font-semibold">Cédula</th>
							<th class="px-4 py-3 text-left font-semibold">Plan</th>
							<th class="px-4 py-3 text-left font-semibold">Fecha Inicio</th>
							<th class="px-4 py-3 text-left font-semibold">Fecha Fin</th>
							<th class="px-4 py-3 text-right font-semibold">Valor</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredClientes as cliente}
							{#each cliente.inscripciones as inscripcion}
								<tr class="border-b hover:bg-gray-50">
									<td class="px-4 py-3">{`${cliente.nombre} ${cliente.apellido}`}</td>
									<td class="px-4 py-3">{cliente.cedula}</td>
									<td class="px-4 py-3">{inscripcion.plan.nombre}</td>
									<td class="px-4 py-3">{formatDate(inscripcion.fechaInicio)}</td>
									<td class="px-4 py-3">{formatDate(inscripcion.fechaFin)}</td>
									<td class="px-4 py-3 text-right">${Number(inscripcion.plan.precio).toFixed(2)}</td
									>
								</tr>
							{/each}
						{/each}
						<tr class="bg-[var(--sections)] font-bold">
							<td colspan="5" class="px-4 py-3 text-right">TOTAL:</td>
							<td class="px-4 py-3 text-right">${Number(totales.totalIngresos).toFixed(2)}</td>
						</tr>
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
