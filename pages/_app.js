import '../styles/globals.css'
import { RecoilRoot } from 'recoil';
import LoginChecker from '../components/common/LoginChecker';
function MyApp({ Component, pageProps }) {
  return (
    <RecoilRoot>
      <LoginChecker/>
      <Component {...pageProps} />
    </RecoilRoot>
  )
}

export default MyApp
