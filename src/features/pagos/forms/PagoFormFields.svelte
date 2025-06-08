// src/features/clientes/components/individual/pagos/forms/PagoFormFields.svelte
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
    export let añoRenovacion: number = new Date().getFullYear();
    export let showPlanField = true;
    export let showDateField = true;
    export let showObservationsField = true;
    export let maxMonto: number | undefined = undefined;
    export let helperTextMonto = '';
    
    // Nuevas props para cuotas de mantenimiento
    export let incluyeAnualidad: boolean = false;
    export let cuotasPendientes: any[] = [];
    export let montoDesglose: { plan: number; anualidad: number; cuotasPendientes: number } | null = null;
    
    // Computed
    $: metodoPagoOptions = [
        { value: '', label: 'No especificar' },
        { value: 'Efectivo', label: 'Efectivo' },
        { value: 'Transferencia', label: 'Transferencia' },
        { value: 'Tarjeta', label: 'Tarjeta de crédito/débito' }
    ];
    
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
    }    // Helper text dinámico para monto con cuotas de mantenimiento
    $: montoHelperText = planSeleccionado
        ? (() => {
            if (montoDesglose) {
                const parts = [];
                parts.push(`Plan: $${montoDesglose.plan.toFixed(2)}`);
                
                if (montoDesglose.anualidad > 0) {
                    parts.push(`Renovación anual: $${montoDesglose.anualidad.toFixed(2)}`);
                }
                
                if (montoDesglose.cuotasPendientes > 0) {
                    parts.push(`Cuotas pendientes: $${montoDesglose.cuotasPendientes.toFixed(2)}`);
                }
                
                return `${parts.join(' + ')} = Total: $${precioTotal.toFixed(2)}. Si no especificas monto, se tomará el precio completo.`;
            } else {
                const annualFee = precioTotal - planSeleccionado.precio;
                return annualFee > 0 
                    ? `Plan: $${planSeleccionado.precio.toFixed(2)} + Renovación anual: $${annualFee.toFixed(2)} = Total: $${precioTotal.toFixed(2)}. Si no especificas monto, se tomará el precio completo.`
                    : `Plan: $${planSeleccionado.precio.toFixed(2)}. No se aplica fee anual este año. Si no especificas monto, se tomará el precio completo.`;
            }
        })()        
        : helperTextMonto || 'Seleccione un plan para ver el precio total';
</script>

<!-- Checkbox para incluir anualidad -->
{#if isRenovacion}
    <div class="w-full space-y-1.5">
        <label class="flex items-center space-x-2">
            <input
                type="checkbox"
                bind:checked={incluyeAnualidad}
                class="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span class="text-md font-bold text-[var(--letter)]">
                Incluir cuota de mantenimiento anual {añoRenovacion} ($10.00)
            </span>
        </label>
        <p class="text-sm text-gray-600">
            La cuota de mantenimiento anual cubre el mantenimiento de máquinas y equipos.
        </p>
    </div>
{/if}

<!-- Información de cuotas pendientes -->
{#if cuotasPendientes.length > 0}
    <div class="rounded-md border border-orange-200 bg-orange-50 p-4">
        <h4 class="mb-2 font-bold text-orange-800">⚠️ Cuotas de Mantenimiento Pendientes</h4>
        <div class="space-y-1 text-sm text-orange-700">
            {#each cuotasPendientes as cuota}
                <p>• {cuota.descripcion}: ${cuota.monto.toFixed(2)} (Vence: {new Date(cuota.fechaVencimiento).toLocaleDateString()})</p>
            {/each}
            <div class="mt-2 border-t border-orange-300 pt-2">
                <p class="font-semibold">
                    Total pendiente: ${cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0).toFixed(2)}
                </p>
                <p class="text-xs">
                    Estas cuotas se incluirán automáticamente en el pago.
                </p>
            </div>
        </div>
    </div>
{/if}

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
        <FormField
            name="metodoPago"
            label="Método de pago (Opcional)"
            type="select"
            options={metodoPagoOptions}
            bind:value={form.metodoPago}
            {errors}
            {touched}
        />
    </FormRow>
{:else}
    <FormRow>
        <FormField
            name="metodoPago"
            label="Método de pago (Opcional)"
            type="select"
            options={metodoPagoOptions}
            bind:value={form.metodoPago}
            {errors}
            {touched}
        />
        <div></div>
    </FormRow>
{/if}

<FormRow>
    <FormField
        name="monto"
        label="Monto a pagar (Opcional)"
        type="number"
        placeholder={precioTotal ? precioTotal.toFixed(2) : "0.00"}
        helperText={montoHelperText}
        unit="$"
        min={1}
        max={maxMonto || precioTotal}
        step="0.01"
        bind:value={form.monto}
        {errors}
        {touched}
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

{#if form.metodoPago === 'Transferencia'}
    <FormRow>
        <FormField
            name="referencia"
            label="Referencia de transferencia"
            placeholder="Ej: TRF-123456"
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

<!-- Resumen del pago -->
{#if planSeleccionado && form.fechaInicio}
    <div class="mt-6 rounded-md bg-gray-50 p-4">
        <h3 class="mb-2 font-semibold">
            Resumen del {isRenovacion ? 'renovación' : 'pago'}:
        </h3>
        <div class="space-y-1 text-sm text-gray-600">
            <p>Plan: {planSeleccionado.nombre}</p>
            <p>
                Duración: {planSeleccionado.duracionMeses}
                {planSeleccionado.duracionMeses === 1 ? 'mes' : 'meses'}
            </p>
            <div class="mt-2 border-t pt-2">
                {#if montoDesglose}
                    <p>Precio del plan: ${montoDesglose.plan.toFixed(2)}</p>
                    {#if montoDesglose.anualidad > 0}
                        <p>Cuota anual {añoRenovacion}: ${montoDesglose.anualidad.toFixed(2)}</p>
                    {/if}
                    {#if montoDesglose.cuotasPendientes > 0}
                        <p>Cuotas pendientes: ${montoDesglose.cuotasPendientes.toFixed(2)}</p>
                    {/if}
                {:else}
                    <p>Precio del plan: ${planSeleccionado.precio.toFixed(2)}</p>
                    {#if incluyeAnualidad || (isRenovacion && precioTotal > planSeleccionado.precio)}
                        <p>Renovación anual {añoRenovacion}: $10.00</p>
                    {/if}
                {/if}
                <p class="font-bold">Total: ${precioTotal.toFixed(2)}</p>
                <p>Monto a pagar: ${form.monto || precioTotal.toFixed(2)}</p>
                {#if !form.monto}
                    <p class="text-xs text-blue-600">
                        (Se tomará el precio completo automáticamente)
                    </p>
                {:else if parseFloat(form.monto.toString()) < precioTotal}
                    <p class="font-medium text-yellow-600">
                        Restante: ${(precioTotal - parseFloat(form.monto.toString())).toFixed(2)}
                        (Pago será marcado como Pendiente)
                    </p>
                {/if}
            </div>
            <p>Fecha de inicio: {form.fechaInicio}</p>
            <p>
                Fecha de fin: {calcularFechaFin(form.fechaInicio, planSeleccionado.duracionMeses)}
            </p>
        </div>
    </div>
{/if}
