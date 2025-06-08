<script lang="ts">
    import FormField from '$lib/components/ui/forms/FormField.svelte';
    import FormRow from '$lib/components/ui/forms/FormRow.svelte';
    import type { Plan } from '../../planes/api';
    
    export let form: any;
    export let errors: any;
    export let touched: any;
    export let planes: Plan[] = [];
    export let planSeleccionado: Plan | null = null;
    export let precioTotal: number = 0;
    export let caracteresRestantes: number = 150;
    export let isRenovacion: boolean = false;
    export let showPlanField = true;
    export let showDateField = true;
    export let showObservationsField = true;
    export let showReferenceField = true;
    export let maxMonto: number | undefined = undefined;
    export let helperTextMonto = '';
    // Nuevas props para cuotas de mantenimiento
    export let cuotasPendientes: any[] = [];
    
    // Computed    // metodoPago field removed as per new requirements - payment method is no longer tracked
    
    $: planOptions = [
        { value: '', label: 'Seleccionar plan' },
        ...planes.map((plan) => ({
            value: plan.idPlan.toString(),
            label: `${plan.nombre} (${plan.duracionMeses} ${
                plan.duracionMeses === 1 ? 'mes' : 'meses'
            }) - $${plan.precio.toFixed(2)}`
        }))
    ];

    // Calcular fecha de fin
    function calcularFechaFin(fechaInicio: string, duracionMeses: number): string {
        if (!fechaInicio) return '';
        const fecha = new Date(fechaInicio);
        fecha.setMonth(fecha.getMonth() + duracionMeses);
        return fecha.toISOString().split('T')[0];
    }    // Helper text dinámico para monto con cuotas de mantenimiento - MEJORADO
    $: montoHelperText = (() => {
        if (helperTextMonto) return helperTextMonto;
        
        if (!planSeleccionado) {
            return 'Seleccione un plan para ver el precio total';
        }
        
        const cuotasPendientesTotal = cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
        
        if (cuotasPendientesTotal > 0) {
            return `Plan: $${planSeleccionado.precio.toFixed(2)} + Cuotas pendientes: $${cuotasPendientesTotal.toFixed(2)} = Total requerido: $${precioTotal.toFixed(2)}`;
        } else {
            return `Precio del plan: $${planSeleccionado.precio.toFixed(2)}. Si no especifica monto, se tomará el precio completo.`;
        }
    })();
</script>

<!-- Selección de plan -->
{#if showPlanField}
    <FormRow>
        <FormField
            name="idPlan"
            label="Plan"
            type="select"
            options={planOptions}
            bind:value={form.idPlan}
            {errors}
            {touched}
        />
        <div></div>
    </FormRow>
{/if}

<FormRow>
    <FormField
        name="monto"
        label="Monto a pagar {cuotasPendientes.length > 0 ? '(Requerido)' : '(Opcional)'}"
        type="number"
        placeholder={precioTotal ? precioTotal.toFixed(2) : "0.00"}
        helperText={montoHelperText}
        unit="$"
        min={cuotasPendientes.length > 0 ? precioTotal : 0.01}
        max={maxMonto}
        step="0.01"
        bind:value={form.monto}
        {errors}
        {touched}
        required={cuotasPendientes.length > 0}
    />
    {#if showDateField}
        <FormField
            name="fechaInicio"
            label="Fecha de inicio (Opcional)"
            type="date"
            helperText="Si no se especifica, se usará la fecha actual"
            bind:value={form.fechaInicio}
            {errors}
            {touched}
        />
    {:else}
        <div></div>
    {/if}
</FormRow>

{#if showReferenceField}
    <FormRow>
        <FormField
            name="referencia"
            label="Referencia (Opcional)"
            placeholder="Ej: TRF-123456, Boleta #123, etc."
            bind:value={form.referencia}
            {errors}
            {touched}
        />
        <div></div>
    </FormRow>
{/if}

{#if showObservationsField}
    <div class="w-full space-y-1.5">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="text-md font-bold text-[var(--letter)]">Observaciones (Opcional)</label>
        <textarea
            name="observaciones"
            bind:value={form.observaciones}
            class="flex min-h-[80px] w-full rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Comentarios adicionales sobre el pago..."
            maxlength="150"
        ></textarea>
        <p class={`text-sm ${caracteresRestantes < 10 ? 'text-red-500' : 'text-gray-500'}`}>
            {caracteresRestantes} caracteres restantes
        </p>
    </div>
{/if}
