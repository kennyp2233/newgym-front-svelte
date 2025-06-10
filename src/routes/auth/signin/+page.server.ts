// src/routes/auth/signin/+page.server.ts
import { redirectIfAuthenticated } from '$lib/auth/guards'
import type { RequestEvent } from '@sveltejs/kit'

export const load = async (event: RequestEvent<Partial<Record<string, string>>, string | null>) => {
    await redirectIfAuthenticated(event)
    
    // Get error and callbackUrl from URL parameters
    const url = event.url
    const error = url.searchParams.get('error')
    const callbackUrl = url.searchParams.get('callbackUrl') || '/clientes'
    
    return {
        error,
        callbackUrl
    }
}