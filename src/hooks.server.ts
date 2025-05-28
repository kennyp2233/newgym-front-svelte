// src/hooks.server.ts
import { SvelteKitAuth } from "@auth/sveltekit"
import Auth0 from "@auth/sveltekit/providers/auth0"
import { AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN, AUTH_SECRET } from "$env/static/private"

export const { handle, signIn, signOut } = SvelteKitAuth({
    providers: [
        Auth0({
            clientId: AUTH0_CLIENT_ID,
            clientSecret: AUTH0_CLIENT_SECRET,
            issuer: `https://${AUTH0_DOMAIN}`,
            authorization: {
                params: {
                    scope: "openid profile email",
                    audience: `https://${AUTH0_DOMAIN}/api/v2/`
                }
            }
        })
    ],
    secret: AUTH_SECRET,
    trustHost: true,
    callbacks: {
        async jwt({ token, account, profile }) {
            // Persiste el token de Auth0
            if (account) {
                token.accessToken = account.access_token
                token.idToken = account.id_token
            }
            return token
        },
        async session({ session, token }) {
            // Envía propiedades al cliente
            session.accessToken = token.accessToken as string
            session.idToken = token.idToken as string
            return session
        }
    }
})