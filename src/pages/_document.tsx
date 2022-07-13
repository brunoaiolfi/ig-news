import Document, { Html, Main, Head, NextScript } from "next/document";

export default class MyDocument extends Document {
    render() {
        return (

            <Html >
                <Head>
                    <link rel="preconnect" href="https://fonts.gstatic.com" />
                    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap" rel="stylesheet" />

                    <link rel="shortcut icon" href="favicon.png" type="image/png" />
                    <title>ig.news</title>
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>

        )
    }
}

