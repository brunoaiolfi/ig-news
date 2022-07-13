import { GetStaticProps } from 'next';
import React from "react"
import Head from 'next/head';
import styles from './home.module.scss';
import { SubscribeButton } from "../components/SubscribeButton";
import { stripe } from '../services/stripe';

interface HomeProps {
  product: {
    id: string,
    unitAmount: number,
  }
}
export default function Home({ product }: HomeProps) {
  return (
    <>
      <Head>
        <title>Home | ig.news</title>
      </Head>

      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span>👋 Hey, welcome </span>
          <h1>
            News about the <span>React</span> world.
          </h1>
          <p>
            Get access to all the publications <br />
            <span>for {product.unitAmount} month</span>
          </p>

          <SubscribeButton priceId={product.id} />
        </section>

        <img src="/images/avatar.svg" alt="girl codding" />
      </main>

    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {

  const price = await stripe.prices.retrieve('price_1LKNPyHCCvb43iIlZlygd46a')

  const product = {
    id: price.id,
    unitAmount:
      new Intl.NumberFormat(
        'en-US',
        {
          style: 'currency',
          currency: 'USD',
        }
      ).format(price.unit_amount / 100),
  }

  return {
    props: {
      product
    },
    revalidate: 60 * 60 * 24 * 7, // 1 week = ( 60s * 60m * 24h * 7d )
  }
}