import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata={title:"La😂Print — Automated Trading Terminal",description:"Drift-backed automated trading for Solana markets."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}