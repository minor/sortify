import NextAuth, { NextAuthOptions } from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

const scope = 'playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative';

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID as string,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
      authorization: { params: { scope } }
    }),
  ],
  callbacks: {
    async jwt({ token, account }: { token: JWT, account?: any }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };