// src/lib/stores/authStore.ts
import { writable, type Readable } from 'svelte/store'
import { page } from '$app/stores'
import { derived } from 'svelte/store'

export interface AuthUser {
    id: string
    name?: string | null
    email?: string
    image?: string
    [key: string]: any
}

export interface AuthSession {
    user?: AuthUser
    expires: string
    accessToken?: string
    idToken?: string
}

// Store reactivo que extrae la sesión de page.data
export const session: Readable<any | null> = derived(
    page,
    ($page) => $page.data?.session || null
)

// Store computed para saber si está autenticado
export const isAuthenticated: Readable<boolean> = derived(
    session,
    ($session) => !!$session?.user
)

// Store computed para obtener el usuario actual
export const user: Readable<AuthUser | null> = derived(
    session,
    ($session) => $session?.user || null
)