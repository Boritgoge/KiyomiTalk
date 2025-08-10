import { useEffect, useState } from 'react'

export default function ToolsPage() {
  const [letterCount, setLetterCount] = useState(0)
  var oEditors = []

  useEffect(() => {
    if (window.nhn && window.nhn.husky && window.nhn.husky.EZCreator) {
      window.nhn.husky.EZCreator.createInIFrame({
        oAppRef: oEditors,
        elPlaceHolder: 'weditor',
        sSkinURI: '/static/smarteditor/SmartEditor2Skin.html',
        fCreator: 'createSEditor2',
        htParams: {
          bUseToolbar: false,
          bUseVerticalResizer: false,
          bUseModeChanger: false,
        }
      })
    }
  }, [])
  
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'row',
          justifyContent: 'flex-start'
        }}
      >
        <div style={{ width: '35%' }}>
          <textarea 
            name="weditor" 
            id="weditor" 
            style={{ 
              width: '500px', 
              height: '700px', 
              maxHeight: '700px', 
              border: '1px solid #DDDDDD', 
              borderRadius: '4px', 
              padding: '10px', 
              overflow: 'auto'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              style={{ padding: '20px 80px', marginRight: '65px' }}
              onClick={() => {
                const iframe = document.querySelector('iframe')
                if (!iframe || !iframe.contentWindow) return
                
                const innerIframe = iframe.contentWindow.document.querySelector('iframe')
                if (!innerIframe || !innerIframe.contentWindow) return
                
                const se2Inputarea = innerIframe.contentWindow.document.querySelectorAll('.se2_inputarea')
                if (!se2Inputarea[0]) return
                
                for (const item of se2Inputarea[0].querySelectorAll('.se-placesMap,.se-video,.se-is-empty,.se-module-image,.se-imageGroup,.__se-cursor-unrelated,.se-imageStrip,button,.se-oglink')) {
                  item.remove()
                }

                const content = se2Inputarea[0].innerText
                setLetterCount(content.replace(/\s*/g, '').length)
              }}
            >
              진단
            </button>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ marginRight: '10px' }}>글자수 </h2>
            <h2>{letterCount}</h2>
          </div>
        </div>
      </div>
    </>
  )
}