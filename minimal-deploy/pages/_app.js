export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
