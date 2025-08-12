import '../src/app/styles/reset.css'
import '../src/app/styles/globals.css'
import '../styles/editor-cursors.css'
import { Providers } from '../src/app/providers'
import Script from 'next/script'
import { ModalProvider, setGlobalModal } from '../components/common/Modal'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import MainLayout from '../components/layout/MainLayout'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const noLayoutPages = ['/login', '/invite/[code]']
  const shouldUseLayout = !noLayoutPages.includes(router.pathname)

  return (
    <Providers>
      <ModalProvider>
        <ModalContent 
          Component={Component} 
          pageProps={pageProps} 
          useLayout={shouldUseLayout}
        />
      </ModalProvider>
    </Providers>
  )
}

function ModalContent({ Component, pageProps, useLayout }) {
  const { showAlert, showConfirm } = require('../components/common/Modal').useModal();
  
  useEffect(() => {
    setGlobalModal(showAlert, showConfirm);
  }, [showAlert, showConfirm]);

  const content = useLayout ? (
    <MainLayout>
      <Component {...pageProps} />
    </MainLayout>
  ) : (
    <Component {...pageProps} />
  );

  return (
    <>
      <Script
        strategy="beforeInteractive"
        src="/static/smarteditor/js/service/HuskyEZCreator.js"
        async="true"
      />
      {content}
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
