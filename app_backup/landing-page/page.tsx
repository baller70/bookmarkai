'use client'

import React from 'react'
import Header from '../../components/Landing Page/components/Header'
import HeroSection from '../../components/Landing Page/components/HeroSection'
import VideoSection from '../../components/Landing Page/components/VideoSection'
import AnswerYesSection from '../../components/Landing Page/components/AnswerYesSection'
import ProjectFeatures from '../../components/Landing Page/components/ProjectFeatures'

export default function LandingPage() {
  return (
    <>
      {/* Site header */}
      <Header />

      {/* Hero */}
      <HeroSection />

      {/* Video walkthrough */}
      <VideoSection />

      {/* Answer YES section */}
      <AnswerYesSection />

      {/* Product features walkthrough */}
      <ProjectFeatures />
    </>
  )
} 