import { FaGithub } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'

import styles from './index.module.scss'

import { signIn, signOut, useSession } from 'next-auth/react'

export function SignInButton() {

    const { data: session } = useSession()

    return session ? (
        <button
            onClick={() => signOut()}
            className={styles.signInButton}
            type="button"
        >
            <FaGithub color='#04d361' />
            <p>
                {session.user.name}
            </p>

            <FiX color="#737380" className={styles.closeIcon} />
        </button>
    ) :
        <button
            onClick={() => signIn('github')}
            className={styles.signInButton}
            type="button"
        >
            <FaGithub color='#eba417' />
            <p>
                Sign In
            </p>
        </button>


}