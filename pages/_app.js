import '../src/app/styles/globals.css'
import '../styles/editor-cursors.css'
import { Providers } from '../src/app/providers'
import Script from 'next/script'
import { ModalProvider, setGlobalModal } from '../components/common/Modal'
import { useEffect } from 'react'

function MyApp({ Component, pageProps }) {
  return (
    <Providers>
      <ModalProvider>
        <ModalContent Component={Component} pageProps={pageProps} />
      </ModalProvider>
    </Providers>
  )
}

function ModalContent({ Component, pageProps }) {
  const { showAlert, showConfirm } = require('../components/common/Modal').useModal();
  
  useEffect(() => {
    setGlobalModal(showAlert, showConfirm);
  }, [showAlert, showConfirm]);

  return (
    <>
      <Script
        strategy="beforeInteractive"
        src="/static/smarteditor/js/service/HuskyEZCreator.js"
        async="true"
      />
      <Component {...pageProps} />
      <div id="modal-root" />
      <Script id="Adsense-id"
        data-ad-client="ca-pub-4111350052400529"
        async="true"
        strategy="beforeInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
      />
    </>
  )
}

export default MyApp
