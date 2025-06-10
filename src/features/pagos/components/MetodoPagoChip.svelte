<script lang="ts">
    export let metodo: string;
    export let size: 'sm' | 'md' = 'sm';
    
    function getMetodoPagoColor(metodo: string): string {
        switch (metodo) {
            case 'Efectivo':
                return 'bg-green-100 text-green-800';
            case 'Transferencia':
                return 'bg-blue-100 text-blue-800';
            case 'Tarjeta':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }
    
    $: sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
</script>

<span class="rounded-full font-medium whitespace-nowrap {getMetodoPagoColor(metodo)} {sizeClasses}">
    {metodo || 'No especificado'}
</span>
