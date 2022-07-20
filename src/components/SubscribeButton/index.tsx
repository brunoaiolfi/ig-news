import styles from './index.module.scss'
import { signIn, useSession } from 'next-auth/react'
import { api } from '../../services/axios';
import { getStripeJs } from '../../services/stripe-js';
import { useRouter } from 'next/router';

interface SubscribeButtonProps {
    priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
    // Pega os dados do usuário logado
    const { data: session } = useSession()
    const router = useRouter()
    async function handleSubscribe() {
        // Caso não esteja logado
        if (!session) {
            // Faz o login
            signIn('github');
            return;
        }

        if (session.userActiveSubscription) {
            router.push('/posts')
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