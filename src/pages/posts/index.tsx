import { GetStaticProps } from 'next';
import Head from 'next/head';
import { getPrismicClient } from '../../services/prismic';
import styles from './styles.module.scss';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom'
import Link from 'next/link';

interface PostsProps {
    posts: Post[]
}

interface Post {
    slug: string;
    title: string;
    excerpt: string;
    updatedAt: string;
}
export default function PostsList({ posts }: PostsProps) {
    return (
        <>
            <Head>
                <title>Posts</title>
            </Head>

            <main className={styles.container}>
                <div className={styles.posts}>

                    {
                        posts.map(({ excerpt, slug, title, updatedAt, }) => (
                            <Link href={`/posts/${slug}`}>
                                <a key={slug}>
                                    <time>{updatedAt}</time>
                                    <strong>{title}</strong>
                                    <p>{excerpt}</p>
                                </a>
                            </Link>
                        ))
                    }

                </div>
            </main>
        </>
    )
}

export const getStaticProps: GetStaticProps = async () => {
    const prismic = getPrismicClient()

    const response = await prismic.getByType('publication', {
        lang: 'pt-BR',
    });

    console.log(JSON.stringify(response, null, 2))

    const posts = response.results.map(post => {
        return {
            slug: post.uid,
            title: RichText.asText(post.data.title),
            excerpt: post.data.content.find(content => content.type === 'paragraph')?.text ?? '',
            updatedAt: new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }),
        }
    })

    return {
        props: {
            posts
        }
    }
}