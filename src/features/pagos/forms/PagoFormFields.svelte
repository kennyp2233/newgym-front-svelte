<script lang="ts">
    import FormField from '$lib/components/ui/forms/FormField.svelte';
    import FormRow from '$lib/components/ui/forms/FormRow.svelte';
    import type { Plan } from '../../planes/api';
    
    export let form: any;
    export let errors: any;
    export let touched: any;
    export let planes: Plan[] = [];
    export let planSeleccionado: Plan | null = null;    export let caracteresRestantes: number = 150;
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
    }    // Helper text limpio y conciso
    $: montoHelperText = (() => {
        if (helperTextMonto) return helperTextMonto;
        
        if (!planSeleccionado) {
            return 'Seleccione un plan para ver el precio';
        }
        
        const cuotasTotal = cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
        let mensaje = `Plan: $${planSeleccionado.precio.toFixed(2)}`;
        
        if (cuotasTotal > 0) {
            mensaje += ` • Total con cuotas: $${(planSeleccionado.precio + cuotasTotal).toFixed(2)}`;
        }
        
        return mensaje;
    })();
</script>

<!-- Formulario organizado con mejor espaciado -->
<div class="space-y-6">
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

    <!-- Cuotas pendientes (si las hay) -->
    {#if cuotasPendientes.length > 0}
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-medium text-amber-800 text-sm">Cuotas Pendientes</h4>
                    <p class="text-xs text-amber-600 mt-1">Se incluirán automáticamente</p>
                </div>
                <div class="text-right">
                    <span class="font-bold text-amber-800">
                        +${cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0).toFixed(2)}
                    </span>
                    {#if cuotasPendientes.length > 1}
                        <p class="text-xs text-amber-600">
                            {cuotasPendientes.length} cuotas
                        </p>
                    {/if}
                </div>
            </div>
        </div>
    {/if}

    <!-- Monto y fecha -->
    <FormRow>
        <FormField
            name="monto"
            label="Monto del Plan"
            type="number"
            placeholder={planSeleccionado ? planSeleccionado.precio.toFixed(2) : "0.00"}
            helperText={montoHelperText}
            unit="$"
            min={0.01}
            max={planSeleccionado ? planSeleccionado.precio : maxMonto}
            step="0.01"
            bind:value={form.monto}
            {errors}
            {touched}
            required={true}
        />
        {#if showDateField}
            <FormField
                name="fechaInicio"
                label="Fecha de inicio"
                type="date"
                helperText="Opcional"
                bind:value={form.fechaInicio}
                {errors}
                {touched}
            />
        {:else}
            <div></div>
        {/if}
    </FormRow>

    <!-- Referencia -->
    {#if showReferenceField}
        <FormRow>
            <FormField
                name="referencia"
                label="Referencia"
                placeholder="Ej: TRF-123456, Boleta #123"
                helperText="Opcional"
                bind:value={form.referencia}
                {errors}
                {touched}
            />
            <div></div>
        </FormRow>
    {/if}

    <!-- Observaciones -->
    {#if showObservationsField}
        <div class="space-y-2">
            <label class="text-sm font-medium text-[var(--letter)]">
                Observaciones
                <span class="text-gray-500 font-normal">(Opcional)</span>
            </label>
            <textarea
                name="observaciones"
                bind:value={form.observaciones}
                class="w-full min-h-[80px] rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Comentarios adicionales..."
                maxlength="150"
            ></textarea>
            <p class="text-xs text-right {caracteresRestantes < 10 ? 'text-red-500' : 'text-gray-500'}">
                {caracteresRestantes} caracteres restantes
            </p>
        </div>
    {/if}
</div>
