"use client";

import { animate, createScope } from "animejs";
import { useEffect, useRef } from "react";

function DiagonalAnimation() {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<ReturnType<typeof createScope> | null>(null);
  const circle1Ref = useRef<HTMLDivElement>(null);
  const circle2Ref = useRef<HTMLDivElement>(null);
  const circle3Ref = useRef<HTMLDivElement>(null);
  const circle4Ref = useRef<HTMLDivElement>(null);
  const circle5Ref = useRef<HTMLDivElement>(null);
  const circle6Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const width = window.innerWidth;
    const isMobile = width < 450;

    scope.current = createScope({ root }).add(() => {
      if (circle1Ref.current) animate(circle1Ref.current, { translateX: -width, translateY: width, duration: isMobile ? 5000 : 7000, loop: true, ease: "linear" });
      if (circle2Ref.current) animate(circle2Ref.current, { translateX: -width, translateY: width, duration: isMobile ? 4000 : 6000, loop: true, ease: "linear" });
      if (circle3Ref.current) animate(circle3Ref.current, { translateX: -width, translateY: width, duration: isMobile ? 3000 : 5000, loop: true, ease: "linear" });
      if (circle4Ref.current) animate(circle4Ref.current, { translateX: -width, translateY: width, duration: isMobile ? 4500 : 6500, loop: true, ease: "linear" });
      if (circle5Ref.current) animate(circle5Ref.current, { translateX: -width, translateY: width, duration: isMobile ? 3500 : 5500, loop: true, ease: "linear" });
      if (circle6Ref.current) animate(circle6Ref.current, { translateX: -width, translateY: width, duration: isMobile ? 2500 : 4500, loop: true, ease: "linear" });
    });
  }, []);

  return (
    <div className="flex">
      <div ref={circle1Ref} className="h-6 w-6 bg-primary rounded-full"></div>
      <div ref={circle2Ref} className="ml-8 h-4 w-4 bg-primary rounded-full"></div>
      <div ref={circle3Ref} className="ml-10 h-2 w-2 bg-primary rounded-full"></div>
      <div ref={circle4Ref} className="ml-12 h-6 w-6 bg-primary rounded-full"></div>
      <div ref={circle5Ref} className="ml-14 h-4 w-4 bg-primary rounded-full"></div>
      <div ref={circle6Ref} className="ml-6 h-6 w-6 bg-primary rounded-full"></div>
    </div>
  );
}

export default DiagonalAnimation;
