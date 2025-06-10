// src/hooks.server.ts
import { SvelteKitAuth } from "@auth/sveltekit"
import Auth0 from "@auth/sveltekit/providers/auth0"
import { env } from "$env/dynamic/private"

console.log('Auth0 Configuration:', {
    domain: env.AUTH0_DOMAIN,
    clientId: env.AUTH0_CLIENT_ID ? 'set' : 'not set',
    clientSecret: env.AUTH0_CLIENT_SECRET ? 'set' : 'not set',
    authSecret: env.AUTH_SECRET ? 'set' : 'not set'
})

export const { handle, signIn, signOut } = SvelteKitAuth({
    providers: [Auth0({
        clientId: env.AUTH0_CLIENT_ID || 'dummy-client-id',
        clientSecret: env.AUTH0_CLIENT_SECRET || 'dummy-client-secret',
        issuer: `https://${env.AUTH0_DOMAIN || 'dummy.auth0.com'}`,
        authorization: {
            params: {
                scope: "openid profile email read:shows",
                audience: `https://${env.AUTH0_DOMAIN || 'dummy.auth0.com'}/api/v2/`
            }
        }
    })
    ],
    secret: env.AUTH_SECRET || 'fallback-secret-for-build-only-not-for-production',
    trustHost: true,
    debug: true,
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