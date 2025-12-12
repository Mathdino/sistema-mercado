import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
})

export const nextAuthWithCallbacks = NextAuth({
  callbacks: {
    async signIn({ account, profile }: any) {
      if (account.provider === "google") {
        return profile.email_verified && profile.email.endsWith("@example.com")
      }
      return true
    },
  },
})
