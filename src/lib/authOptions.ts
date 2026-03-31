import connectToDatabase from "./mongoose";
import { User } from "./models";

export const authOptions = {
  providers: [
    require('next-auth/providers/google').default({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: { signIn: '/login' },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account.provider === 'google') {
        try {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: user.id
            });
          }
          return true;
        } catch (error) {
          console.error("Error saving user", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }: any) {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  }
};
