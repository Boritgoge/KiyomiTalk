import {useEffect, useState} from "react";
export default function Tools() {
    const [letterCount, setLetterCount] = useState(0)
    var oEditors = [];
    useEffect(()=>{
        window.nhn.husky.EZCreator.createInIFrame({
            oAppRef: oEditors,
            elPlaceHolder: "weditor",
            sSkinURI: "/static/smarteditor/SmartEditor2Skin.html",
            fCreator: "createSEditor2",
            htParams: {
                bUseToolbar : false,				// 툴바 사용 여부 (true:사용/ false:사용하지 않음)
                bUseVerticalResizer : false,		// 입력창 크기 조절바 사용 여부 (true:사용/ false:사용하지 않음)
                bUseModeChanger : false,			// 모드 탭(Editor | HTML | TEXT) 사용 여부 (true:사용/ false:사용하지 않음)
            }
        });
    }, [])
    return <>
        <div
            style={{
                display: "flex",
                alignItems: "row",
                justifyContent: "flex-start"
            }}
        >
            <div style={{width:"25%"}}>
                <textarea name="weditor" id="weditor" style={{ width: "500px" , height: '700px', maxHeight: '700px', border: "1px solid #DDDDDD", borderRadius: "4px", padding: "10px", overflow: "auto"}}></textarea>

                <div style={{display: "flex", justifyContent:"flex-end"}}>
                    <button
                        style={{padding:"20px 80px", marginRight:"65px"}}
                        onClick={()=>{
                            const se2Inputarea = document.querySelector('iframe').contentWindow.document.querySelector('iframe').contentWindow.document.querySelectorAll('.se2_inputarea');
                            for (const item of se2Inputarea[0].querySelectorAll('.se-placesMap,.se-video,.se-is-empty,.se-module-image,.se-imageGroup,.__se-cursor-unrelated,.se-imageStrip,button,.se-oglink')) {
                                item.remove();
                            }

                            const content = se2Inputarea[0].innerText;
                            setLetterCount(content.replace(/\s*/g, '').length);
                        }}
                        >진단</button>
                </div>
            </div>
            <div>
                <div style={{display: "flex", justifyContent:"space-between"}}>
                    <h2 style={{marginRight: "10px"}}>글자수 </h2>
                    <h2>{letterCount}</h2>
                </div>
            </div>
        </div>
    </>

}