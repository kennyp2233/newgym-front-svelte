// src/routes/clientes/+layout.server.ts
import { requireAuth } from '$lib/auth/guards'
import type { RequestEvent } from '@sveltejs/kit'

export const load = async (event: RequestEvent<Partial<Record<string, string>>, string | null>) => {
    const session = await requireAuth(event)

    return {
        session
    }
}