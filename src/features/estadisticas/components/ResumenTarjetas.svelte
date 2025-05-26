<!-- src/features/estadisticas/components/ResumenTarjetas.svelte -->
<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { ResumenDashboard } from '../api';

	export let data: ResumenDashboard | null = null;
	export let className: string = '';

	// Determinar el color para la variación porcentual
	$: esVariacionPositiva = (data?.comparativaMensual?.variacionPorcentaje ?? 0) >= 0;
	$: colorVariacion = esVariacionPositiva ? 'text-green-600' : 'text-red-600';
	$: simboloVariacion = esVariacionPositiva ? '+' : '';

	$: tarjetas = data
		? [
				{
					titulo: 'Inscritos este mes',
					valor: data.inscritosMes,
					icono: 'plus',
					color: 'bg-purple-50',
					iconColor: 'text-[var(--primary)]'
				},
				{
					titulo: 'Clientes activos',
					valor: data.clientesActivos,
					icono: 'people',
					color: 'bg-blue-50',
					iconColor: 'text-blue-600'
				},
				{
					titulo: `${data.comparativaMensual.mesAnterior} / ${data.comparativaMensual.mesActual}`,
					valor: `${simboloVariacion}${data.comparativaMensual.variacionPorcentaje}%`,
					icono: 'dashboard',
					color: 'bg-yellow-50',
					iconColor: 'text-yellow-600',
					valorColor: colorVariacion
				},
				{
					titulo: 'Ingresos del mes',
					valor: `$${data.ingresosMes}`,
					icono: 'check',
					color: 'bg-green-50',
					iconColor: 'text-green-600'
				}
			]
		: [];
</script>

<div class={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
	{#if !data}
		<!-- Loading skeleton -->
		{#each Array(4) as _, i}
			<div class="h-24 animate-pulse rounded-lg border border-[var(--border)] bg-gray-100"></div>
		{/each}
	{:else}
		{#each tarjetas as tarjeta, index}
			<div
				class="flex items-center rounded-lg border border-[var(--border)] bg-[var(--sections)] p-4 shadow-sm transition-all hover:shadow-md"
			>
				<div class={`mr-4 rounded-lg p-3 ${tarjeta.color}`}>
					<Icon name={tarjeta.icono} size={24} className={tarjeta.iconColor} />
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium text-gray-600">{tarjeta.titulo}</p>
					<p class={`text-2xl font-bold ${tarjeta.valorColor || 'text-[var(--letter)]'}`}>
						{tarjeta.valor}
					</p>
				</div>
			</div>
		{/each}
	{/if}
</div>
