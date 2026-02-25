import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { getPocketBaseClient, getPocketBaseAdminClient } from "@/lib/pocketbase"
import { ClientResponseError } from "pocketbase"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      return true
    },
    async jwt({ token, user, account }) {
      // User is only available on first sign in, but token.email persists
      const email = user?.email || token.email

      if (email && !token.pocketbaseId) {
        try {
          // Use admin client to ensure we can find users even if emailVisibility is false
          const pb = await getPocketBaseAdminClient()
          let pbUser

          // Try to find the user by email
          try {
            pbUser = await pb.collection('users').getFirstListItem(`email="${email}"`)
          } catch (e) {
            // User not found, try to create new one
            try {
              const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
              const name = user?.name || token.name || ""
              
              // Note: We use the same client (admin or regular) to create
              pbUser = await pb.collection('users').create({
                email: email,
                emailVisibility: true,
                password: randomPassword,
                passwordConfirm: randomPassword,
                name: name,
              })
            } catch (createError) {
              if (createError instanceof ClientResponseError && createError.status === 400) {
                 // Common case: User exists but is not visible (emailVisibility=false)
                 // This happens if Admin authentication failed and we fell back to regular client
                 console.error("User Sync Warning: User likely exists but is not visible to the API. Ensure POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are set in .env.local", createError.response)
              } else {
                 console.error("Failed to create user in PocketBase:", createError)
              }
            }
          }

          if (pbUser) {
            token.pocketbaseId = pbUser.id
          }
        } catch (error) {
          console.error("PocketBase Sync Error in JWT callback:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.pocketbaseId && session.user) {
        // @ts-ignore
        session.user.pocketbaseId = token.pocketbaseId as string
      }
      return session
    }
  }
})
