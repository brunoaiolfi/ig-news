import { query } from "faunadb";
import { NextApiRequest, NextApiResponse } from "next";
import { fauna } from "../../services/faunadb";
import { stripe } from "../../services/stripe";

interface tempUser {
  ref: {
    id: string;
  };
  data: {
    stripe_customer_id: string;
  };
}
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    // Pega os dados do usuário
    const user = await req.body.user;

    // Coleta o usuário atual
    const tempUser = await fauna.query<tempUser>(
      query.Get(
        query.Match(query.Index("user_by_email"), query.Casefold(user.email))
      )
    );

    // Pega o valor do customer id do cliente no stripe
    let customerId = tempUser.data.stripe_customer_id;

    // Se o usuário não tiver um customer id, cria um novo
    if (!customerId) {
      // Cria um cliente no stripe
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
      });

      // Salva o id de cliente no usuário dentro do banco de dados
      await fauna.query(
        query.Update(query.Ref(query.Collection("users"), tempUser.ref.id), {
          data: {
            stripe_customer_id: stripeCustomer.id,
          },
        })
      );

      customerId = stripeCustomer.id;
    }

    // Cria uma session no stripe
    const stripeCheckoutSession = await stripe.checkout.sessions.create({

      //  ID Cliente que ta comprando
      customer: customerId,

      //   Método de pagamento
      payment_method_types: ["card"],

      //   Adicionar endereço como obrigatório
      billing_address_collection: "auto",

      //   Itens do pedido
      line_items: [
        {
          // Preço
          price: "price_1LKNPyHCCvb43iIlZlygd46a",
          //   QNTD
          quantity: 1,
        },
      ],

      //   Modo de pagamento
      mode: "subscription",

      //   Permitir códigos de promoções
      allow_promotion_codes: true,

      //   URL de retorno caso sucesso
      success_url: process.env.STRIPE_SUCCESS_URL,

      // URL de retorno caso cancele
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

    return res.status(200).json({ sessionId: stripeCheckoutSession.id });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};
