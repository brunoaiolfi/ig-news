import { NextApiResponse, NextApiRequest } from "next";
import { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscription";

async function buffer(readable: Readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

// Desabilita o body parser para o stream
export const config = {
  api: {
    bodyParser: false,
  },
};

// Lista de eventos relevantes
const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    // Passa para o buffer todos os dados que recebe
    const buf = await buffer(req);

    // Verifica se a asinatura do evento é válida
    const secret = req.headers["stripe-signature"];

    let event: Stripe.Event;

    try {
      // Função que cria um evento do próprio stripe e também serve para verificar a assinatura
      event = stripe.webhooks.constructEvent(
        buf,
        secret,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // Recebe o tipo de evento, exemplo pagamento.sucesso
    const { type } = event;

    // Caso o evento seja relevante, executa a função
    if (relevantEvents.has(type)) {
      try {
        switch (type) {
          // Caso o usuário mude
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
            //   Armazena a subscription do usuário
            const subscription = event.data.object as Stripe.Subscription;

            await saveSubscription(
              subscription.id,
              subscription.customer.toString(),
            );

            break;

          // Compra concluída
          case "checkout.session.completed":
            // Recebe o evento de checkout
            const checkoutSession = event.data
              .object as Stripe.Checkout.Session;

            await saveSubscription(
              checkoutSession.subscription.toString(),
              checkoutSession.customer.toString(),
              true
            );

            break;

          default:
            throw new Error("Unhandled event type");
        }
      } catch (error) {
        return res.json({ error: "Webhook handler failed." });
      }
    }

    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};
