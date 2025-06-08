// src/hooks.server.ts
import { SvelteKitAuth } from "@auth/sveltekit"
import Auth0 from "@auth/sveltekit/providers/auth0"
import { 
    AUTH0_CLIENT_ID, 
    AUTH0_CLIENT_SECRET, 
    AUTH0_DOMAIN, 
    AUTH_SECRET,
    AUTH0_AUDIENCE,
    AUTH0_SCOPE
} from "$env/static/private"

export const { handle, signIn, signOut } = SvelteKitAuth({
    providers: [        Auth0({
            clientId: AUTH0_CLIENT_ID || 'dummy-client-id',
            clientSecret: AUTH0_CLIENT_SECRET || 'dummy-client-secret',
            issuer: `https://${AUTH0_DOMAIN || 'dummy.auth0.com'}`,
            authorization: {
                params: {
                    scope: AUTH0_SCOPE || "openid profile email",
                    audience: AUTH0_AUDIENCE || `https://${AUTH0_DOMAIN || 'dummy.auth0.com'}/api/v2/`
                }
            }
        })
    ],
    secret: AUTH_SECRET || 'fallback-secret-for-build-only-not-for-production',
    trustHost: true,
    callbacks: {
        async jwt({ token, account, profile }: any) {
            // Persiste el token de Auth0
            if (account) {
                token.accessToken = account.access_token
                token.idToken = account.id_token
            }
            return token
        },
        async session({ session, token }: any) {
            // Envía propiedades al cliente
            session.accessToken = token.accessToken as string
            session.idToken = token.idToken as string
            return session
        }
    }
})