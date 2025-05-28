// src/app.d.ts
import { SvelteKitAuth } from "@auth/sveltekit"
import type { DefaultSession } from "@auth/core/types"

// Extender la sesión con propiedades personalizadas
declare module "@auth/core/types" {
	interface Session {
		accessToken?: string
		idToken?: string
		user?: {
			id: string
		} & DefaultSession["user"]
	}

	interface JWT {
		accessToken?: string
		idToken?: string
	}
}

declare global {
	namespace App {
		interface Locals {
			auth: SvelteKitAuth["auth"]
		}

		interface PageData {
			session?: Session | null
		}

		interface Platform {
			env?: {
				AUTH_SECRET: string
				AUTH0_CLIENT_ID: string
				AUTH0_CLIENT_SECRET: string
				AUTH0_DOMAIN: string
			}
		}
	}
}

export { }