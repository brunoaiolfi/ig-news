import { query } from "faunadb";
import { fauna } from "../../../services/faunadb";
import { stripe } from "../../../services/stripe";

export async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction = false
) {
  // Buscar o usuário no banco do Fauna com o ID do customer
  const userRef = await fauna.query(
    query.Select(
      "ref",
      query.Get(
        query.Match(query.Index("user_by_stripe_customer_id"), customerId)
      )
    )
  );

  //   pega todos os dados da subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  //   Dados que realmente importam para o banco da subscription
  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
  };

  // Salvar a subscriptionId no usuário caso a ação seja de criação
  if (createAction) {
    await fauna.query(
      query.Create(query.Collection("subscriptions"), {
        data: subscriptionData,
      })
    );
  } else {

    await fauna.query(
      query.Replace(
        query.Select(
          "ref",
          query.Get(
            query.Match(query.Index("subscription_by_id"), subscriptionId)
          )
        ),
        { data: subscriptionData }
      )
    );
    
  }
}
