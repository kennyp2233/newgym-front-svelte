<script lang="ts">
	import * as Icons from 'lucide-svelte';

	export let name: string;
	export let size: number = 24;
	export let className: string = '';
	export let strokeWidth: number = 2;
	export let color: string = 'currentColor';

	// Mapeamos los nombres personalizados a los nombres de Lucide
	const iconMap: Record<string, string> = {
		people: 'User',
		'people-fill': 'UserCheck',
		whatsapp: 'MessageSquare',
		dashboard: 'LayoutDashboard',
		'dashboard-outline': 'LayoutDashboard',
		add: 'Plus',
		plus: 'Plus',
		search: 'Search',
		edit: 'Edit',
		pencil: 'Pencil',
		delete: 'Trash2',
		trash: 'Trash2',
		'arrow-left': 'ArrowLeft',
		'arrow-right': 'ArrowRight',
		logout: 'LogOut',
		refresh: 'RefreshCw',
		check: 'Check',
		warning: 'AlertTriangle',
		error: 'AlertOctagon',
		close: 'X',
		x: 'X'
	};

	// Obtener el componente de icono correcto
	$: iconName = iconMap[name] || 'X'; // X como fallback
	$: Icon = (Icons as any)[iconName];
</script>

{#if Icon}
	<Icon {size} class={className} stroke={color} {strokeWidth} />
{:else}
	<!-- Fallback si el icono no existe -->
	<Icons.HelpCircle {size} class={className} stroke={color} {strokeWidth} />
{/if}
