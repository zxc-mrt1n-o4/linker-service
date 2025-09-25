'use client'

import dynamic from 'next/dynamic'

// Dynamically import AboutBlankCloak to ensure it only runs on client
const AboutBlankCloak = dynamic(() => import('@/components/AboutBlankCloak'), { 
  ssr: false 
})

export default function ClientWrapper() {
  return <AboutBlankCloak />
}
