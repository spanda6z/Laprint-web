import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FLOW — Why is it moving?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{width:"100%",height:"100%",background:"#070707",color:"#f4f4f0",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"72px",fontFamily:"Arial"}}>
      <div style={{fontSize:30,fontWeight:700,letterSpacing:-1}}>FLOW</div>
      <div style={{display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:74,fontWeight:700,letterSpacing:-5,lineHeight:0.95}}>Every move has a reason.</div>
        <div style={{marginTop:28,fontSize:28,color:"#85857f"}}>Solana market intelligence · Why is it moving?</div>
      </div>
      <div style={{fontSize:20,color:"#85857f"}}>flow.app</div>
    </div>,
    {...size}
  );
}
