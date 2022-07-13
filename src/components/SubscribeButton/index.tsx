import styles from './index.module.scss'
import { signIn, useSession } from 'next-auth/react'
import { api } from '../../services/axios';
import { getStripeJs } from '../../services/stripe-js';

interface SubscribeButtonProps {
    priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
    // Pega os dados do usuário logado
    const { data: session } = useSession()

    async function handleSubscribe() {
        // Caso não esteja logado
        if (!session) {
            // Faz o login
            signIn('github');
            return;
        }

        try {
            const response = await api.post('/subscribe', {
                user: session.user
            })

            const { sessionId } = response.data;

            const stripe = await getStripeJs()

            await stripe.redirectToCheckout({ sessionId })
        } catch (error) {
            alert(error.message)
        }
    }
    return (
        <button
            className={styles.subscribeButton}
            type="button"
            onClick={handleSubscribe}
        >
            Subscribe now
        </button>
    )
}