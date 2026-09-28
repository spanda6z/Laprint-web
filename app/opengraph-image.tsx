import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FLOW — Solana Market Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"72px",background:"#070707",color:"#f4f4f0",fontFamily:"Arial"}}>
      <div style={{display:"flex",alignItems:"center",gap:"18px",fontSize:34,fontWeight:700,letterSpacing:"-1px"}}>
        <div style={{width:52,height:52,borderRadius:14,background:"#f4f4f0",color:"#070707",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>∿</div>
        FLOW
      </div>
      <div style={{display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:76,fontWeight:700,letterSpacing:"-5px",lineHeight:1}}>See what&apos;s moving.</div>
        <div style={{marginTop:28,fontSize:28,color:"#a4a49e",letterSpacing:"-.5px"}}>Solana market intelligence — discover, understand, watch.</div>
      </div>
      <div style={{display:"flex",fontSize:20,color:"#ff7a18",letterSpacing:"3px"}}>FLOW / MAINNET</div>
    </div>,
    { ...size },
  );
}