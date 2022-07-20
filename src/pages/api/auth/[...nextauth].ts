import { query } from "faunadb";

import NextAuth, { Session } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { fauna } from "../../../services/faunadb";

export default NextAuth({
  providers: [
    // Provider de login com o github
    GithubProvider({
      // Id do cliente do github
      clientId: process.env.GITHUB_CLIENT_ID,
      // Id do secret do github
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // O que eu irei utilizar do usuário
      authorization: {
        params: {
          // Aqui define que irei utilizar o email, nome, avatar e bio do usuário do github
          scope: "read:user",
        },
      },
    }),
  ],

  callbacks: {
    // Durante a função de login

    async session({ session }) {
      try {
        const userActiveSubscription = await fauna.query(
          query.Get(
            query.Intersection([
              query.Match(
                query.Index("subscription_by_user_ref"),
                query.Select(
                  "ref",
                  query.Get(
                    query.Match(
                      query.Index("user_by_email"),
                      query.Casefold(session.user.email)
                    )
                  )
                )
              ),
              query.Match(query.Index("subscription_by_status"), "active"),
            ])
          )
        );

        return {
          ...session,
          userActiveSubscription,
        };
      } catch (error) {
        return {
          ...session,
          userActiveSubscription: null,
        }
      }
    },

    async signIn({ user }) {
      // Coleta o email
      const { email } = user;

      // Inserção dos dados do usuário no banco de dados
      try {
        await fauna.query(
          // Verifica se
          query.If(
            // O usuário não existe
            query.Not(
              query.Exists(
                query.Match(
                  query.Index("user_by_email"),
                  query.Casefold(user.email)
                )
              )
            ),
            // Caso não exista ele irá salvar
            query.Create(query.Collection("users"), {
              data: { email: email },
            }),
            // Caso exista ele apenas irá fazer um get
            query.Get(
              query.Match(
                query.Index("user_by_email"),
                query.Casefold(user.email)
              )
            )
          )
        );

        // Retorna true, mostrando que o login deu certo.
        return true;

        // Se ocorrer algum erro, retorna false, mostrando que o login falhou.
      } catch (error) {
        console.log("error on login:");
        console.log(error.message);
        return false;
      }
    },
  },
});
