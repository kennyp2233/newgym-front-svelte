<script lang="ts">
    export let estado: string;
    export let size: 'sm' | 'md' = 'sm';
    
    function getEstadoColor(estado: string): string {
        switch (estado) {
            case 'Completado':
                return 'bg-green-100 text-green-800';
            case 'Pendiente':
                return 'bg-yellow-100 text-yellow-800';
            case 'Anulado':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }
    
    $: sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
</script>

<span class="rounded-full font-medium whitespace-nowrap {getEstadoColor(estado)} {sizeClasses}">
    {estado || 'Pendiente'}
</span>
