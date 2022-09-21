import '../styles/globals.css'
import { RecoilRoot } from 'recoil';
import LoginChecker from '../components/common/LoginChecker';
function MyApp({ Component, pageProps }) {
  return (
    <RecoilRoot>
      <LoginChecker/>
      <Component {...pageProps} />
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4111350052400529" crossorigin="anonymous"></script>
    </RecoilRoot>
  )
}

export default MyApp
