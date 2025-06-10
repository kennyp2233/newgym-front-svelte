// src/lib/auth/guards.ts
import { redirect } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'

export async function requireAuth(event: RequestEvent) {
    const session = await event.locals.auth()

    if (!session?.user) {
        throw redirect(303, '/auth/signin')
    }

    return session
}

export async function redirectIfAuthenticated(event: RequestEvent) {
    const session = await event.locals.auth()

    if (session?.user) {
        throw redirect(303, '/clientes')
    }
}