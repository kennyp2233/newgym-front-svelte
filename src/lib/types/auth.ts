// src/lib/types/auth.ts
import type { DefaultSession } from "@auth/core/types"

export interface AuthUser {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    sub?: string
    nickname?: string
    preferred_username?: string
    given_name?: string
    family_name?: string
    locale?: string
    updated_at?: string
    email_verified?: boolean
    [key: string]: any
}

export interface AuthSession extends DefaultSession {
    user?: AuthUser
    accessToken?: string
    idToken?: string
    expires: string
    error?: string
}

export interface AuthError {
    message: string
    type: string
}

// Tipos para Auth0 específicos
export interface Auth0Profile {
    sub: string
    name?: string
    nickname?: string
    picture?: string
    email?: string
    email_verified?: boolean
    given_name?: string
    family_name?: string
    locale?: string
    updated_at?: string
    [key: string]: any
}

export interface Auth0Token {
    access_token: string
    id_token?: string
    token_type: string
    expires_in: number
    scope?: string
}