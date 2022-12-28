import '../styles/globals.css'
import { RecoilRoot, RecoilEnv } from 'recoil';
import LoginChecker from '../components/common/LoginChecker';
import Script from 'next/script';
RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = false;
function MyApp({ Component, pageProps }) {
  return (
    <RecoilRoot>
      <Script
        strategy="beforeInteractive"
        src="/static/smarteditor/js/service/HuskyEZCreator.js"
        async="true"
      />
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
