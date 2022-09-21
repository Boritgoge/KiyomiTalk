import '../styles/globals.css'
import { RecoilRoot } from 'recoil';
import LoginChecker from '../components/common/LoginChecker';
import Script from 'next/script';
function MyApp({ Component, pageProps }) {
  return (
    <RecoilRoot>
      <LoginChecker/>
      <Component {...pageProps} />
      <Script id="Adsense-id"
        data-ad-client="ca-pub-4111350052400529"
        async="true"
        strategy="beforeInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
      />
      
    </RecoilRoot>
  )
}

export default MyApp
