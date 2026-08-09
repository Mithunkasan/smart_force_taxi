"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronDown, Compass, Shield, ArrowRight, Activity } from "lucide-react";
import { useTranslation } from "@/components/layout/language-provider";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const { t } = useTranslation();
  const [scrolledVal, setScrolledVal] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    setViewportHeight(window.innerHeight);
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    
    // Fallback if metadata is already loaded
    if (video.readyState >= 1) {
      setIsLoaded(true);
    }

    let animationFrameId: number;
    let targetProgress = 0;
    let currentProgress = 0;
    let targetScrolled = 0;
    let currentScrolled = 0;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const scrolled = -rect.top;
      
      // The hero container has a height of 250vh.
      // The scroll range before the About section starts entering is 250vh - 100vh = 150vh.
      // We play the video completely over this 150vh scroll range.
      const scrollRange = rect.height - window.innerHeight;
      
      if (scrollRange <= 0) return;

      // Calculate progress from 0 to 1 for video playback (reaches 1.0 when next section starts entering)
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));
      targetProgress = progress;
      targetScrolled = scrolled;
      setScrollProgress(progress);

      // Check if we have scrolled past the hero container completely (scrolled >= 250vh)
      // At this point, the About section has fully slid up and covered the viewport
      setIsPastHero(scrolled >= rect.height);
    };

    const updateVideoFrame = () => {
      // Smooth interpolation for scroll progress (LERP)
      currentProgress += (targetProgress - currentProgress) * 0.05;
      currentScrolled += (targetScrolled - currentScrolled) * 0.05;
      setScrolledVal(currentScrolled);
      
      if (video.duration) {
        const targetTime = currentProgress * video.duration;
        // Check if the browser is NOT currently seeking and the time difference is significant.
        // This stops the video decoder from choking on fast scrolls.
        if (!video.seeking && Math.abs(video.currentTime - targetTime) > 0.03) {
          video.currentTime = targetTime;
        }
      }

      animationFrameId = requestAnimationFrame(updateVideoFrame);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    animationFrameId = requestAnimationFrame(updateVideoFrame);

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  // Helper function to calculate smooth opacity curves
  const getOpacity = (start: number, end: number, current: number) => {
    const fadeInRange = 0.06;
    const fadeOutRange = 0.06;
    
    if (current < start || current > end) return 0;
    
    if (current >= start && current < start + fadeInRange) {
      return (current - start) / fadeInRange;
    }
    
    if (current <= end && current > end - fadeOutRange) {
      return (end - current) / fadeOutRange;
    }
    
    return 1;
  };

  const textFrames = [
    {
      title: "Smart Force Taxi",
      subtitle: t("hero_subtitle_1"),
      description: t("hero_desc_1"),
      buttonText: t("hero_btn_1"),
      buttonHref: "#services",
      start: 0,
      end: 0.25
    },
    {
      title: t("hero_title_2"),
      subtitle: t("hero_subtitle_2"),
      description: t("hero_desc_2"),
      buttonText: t("hero_btn_2"),
      buttonHref: "#fleet",
      start: 0.35,
      end: 0.6
    },
    {
      title: t("hero_title_3"),
      subtitle: t("hero_subtitle_3"),
      description: t("hero_desc_3"),
      buttonText: t("hero_btn_3"),
      buttonHref: "/register",
      start: 0.7,
      end: 0.95
    }
  ];

  const logoSrc = "/logo1.png";
  const videoEndScroll = viewportHeight * 1.5;
  const heroEndScroll = viewportHeight * 2.5;

  let logoOpacity = 0;
  if (scrolledVal >= videoEndScroll) {
    logoOpacity = 1;
  } else if (scrolledVal > videoEndScroll - 100 && videoEndScroll > 100) {
    logoOpacity = (scrolledVal - (videoEndScroll - 100)) / 100;
  }

  const isPastTransition = scrolledVal >= heroEndScroll;
  const showLogo = logoOpacity > 0.01;

  const logoStyle: React.CSSProperties = isPastTransition
    ? {
        position: "absolute",
        top: `${heroEndScroll + viewportHeight / 2}px`,
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: logoOpacity,
        zIndex: 30,
        pointerEvents: "none",
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: logoOpacity,
        zIndex: 30,
        pointerEvents: "none",
      };

  return (
    <div ref={containerRef} id="home" className="relative h-[250vh] bg-transparent">
      {/* Fixed Background Video (stays fixed in the viewport, covered by sections below) */}
      <video
        ref={videoRef}
        src="/hero.mp4"
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 w-full h-full object-cover transition-opacity duration-500 dark:brightness-100 brightness-[0.95]"
        style={{
          opacity: isLoaded && !isPastHero ? 1 : 0,
          display: isPastHero ? "none" : "block",
          zIndex: 1,
        }}
      />
      
      {/* Loader Overlay */}
      {!isLoaded && (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Loading Fleet Video...</p>
          </div>
        </div>
      )}

      {/* Floating background color blobs (fixed for parallax look, hidden once covered) */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" style={{ zIndex: 2, display: isPastHero ? "none" : "block" }} />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" style={{ zIndex: 3, display: isPastHero ? "none" : "block" }} />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" style={{ zIndex: 3, display: isPastHero ? "none" : "block" }} />

      {/* Sticky container for text overlays */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center z-10 pointer-events-none">
        
        {/* Interactive timeline slider in bottom-left */}
        <div className="absolute bottom-10 left-6 md:left-10 z-20 hidden sm:flex flex-col gap-1.5 bg-card/60 border border-border p-3 rounded-xl backdrop-blur-md pointer-events-auto">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("active_car_inspection")}</span>
          <div className="w-36 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-75" style={{ width: `${scrollProgress * 100}%` }} />
          </div>
        </div>

        {/* Text overlays with transition opacity based on scroll percentage */}
        <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 text-center">
          {textFrames.map((frame, index) => {
            const opacity = getOpacity(frame.start, frame.end, scrollProgress);
            const translateY = (1 - opacity) * 30; // Slide effect
            
            return (
              <div
                key={index}
                className="absolute inset-x-0 mx-auto transition-all duration-75 flex flex-col items-center justify-center"
                style={{
                  opacity: opacity,
                  transform: `translateY(${translateY}px)`,
                  visibility: opacity > 0.01 ? "visible" : "hidden",
                  pointerEvents: opacity > 0.8 ? "auto" : "none",
                }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-amber-500 text-xs font-semibold tracking-wider uppercase mb-5 backdrop-blur-sm">
                  {index === 0 && <Compass className="w-3.5 h-3.5" />}
                  {index === 1 && <Activity className="w-3.5 h-3.5 text-primary" />}
                  {index === 2 && <Shield className="w-3.5 h-3.5 text-green-500" />}
                  {frame.subtitle}
                </div>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tight uppercase leading-none mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                  {frame.title.split(" ").map((word, i) => (
                    <span
                      key={i}
                      className={
                        word.toLowerCase() === "taxi" || word.toLowerCase() === "gps" || word.toLowerCase() === "driver"
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 block sm:inline"
                          : ""
                      }
                    >
                      {word}{" "}
                    </span>
                  ))}
                </h1>
                <p className="max-w-2xl text-zinc-100 text-sm sm:text-base md:text-lg font-normal mb-8 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {frame.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a
                    href={frame.buttonHref}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-500 text-zinc-950 font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-200"
                  >
                    {frame.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll indicator in footer */}
        <div 
          className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center text-center text-muted-foreground gap-1.5 pointer-events-none animate-bounce transition-opacity duration-300"
          style={{ opacity: scrollProgress > 0.9 ? 0 : 1 }}
        >
          <span className="text-[10px] uppercase font-bold text-muted-foreground">{t("scroll_down_rotate")}</span>
          <ChevronDown className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Centered Logo Transition overlay */}
      {showLogo && (
        <div style={logoStyle} className="transition-opacity duration-150 flex items-center justify-center">
          <img
            src={logoSrc}
            alt="Smart Force Taxi Logo"
            className="w-48 sm:w-64 md:w-80 h-auto object-contain max-h-[30vh]"
          />
        </div>
      )}
    </div>
  );
}
