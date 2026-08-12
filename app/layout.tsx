import type { Metadata } from 'next'
import {
  Inter,
  IBM_Plex_Sans,
  Exo_2,
  Chakra_Petch,
  Share_Tech_Mono,
} from 'next/font/google'
import './tokens.css'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm',
})

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-exo',
})

const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-chakra',
})

const shareTech = Share_Tech_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-share-tech',
})

export const metadata: Metadata = {
  title: 'Empire State of Mind',
  description: 'PROJECT: EMPIRE STATE OF MIND',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`
        ${inter.variable}
        ${ibmPlex.variable}
        ${exo2.variable}
        ${chakra.variable}
        ${shareTech.variable}
      `}
    >
      <body>{children}</body>
    </html>
  )
}