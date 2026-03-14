"use client";

import { animate, createScope, createSpring, createDraggable } from "animejs";
import { useEffect, useRef, useState } from "react";
import Logo from "../../assets/irufano-square-logo.svg";
import Image from "next/image";

interface LogoAnimationProps {
  size?: number;
}

function LogoAnimation({ size = 100 }: LogoAnimationProps) {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<ReturnType<typeof createScope> | null>(null);
  const [rotations, setRotations] = useState(0);

  useEffect(() => {
    scope.current = createScope({ root }).add((self) => {
      animate(".logo", {
        scale: [
          { to: 1.25, ease: "inOut(3)", duration: 200 },
          { to: 1, ease: createSpring({ stiffness: 300 }) },
        ],
        loop: true,
        loopDelay: 250,
      });

      createDraggable(".logo", {
        container: [0, 0, 0, 0],
        releaseEase: createSpring({ stiffness: 200 }),
      });

      self!.add("rotateLogo", (i: number) => {
        animate(".logo", {
          rotate: i * 360,
          ease: "out(4)",
          duration: 1500,
        });
      });
    });

    return () => {
      if (scope.current) scope.current.revert();
    };
  }, []);

  const handleClick = () => {
    setRotations((prev) => {
      const newRotations = prev + 1;
      if (scope.current) {
        (scope.current as unknown as { methods: { rotateLogo: (i: number) => void } }).methods.rotateLogo(newRotations);
      }
      return newRotations;
    });
  };

  return (
    <div ref={root}>
      <div className="large centered row">
        <Image
          onClick={handleClick}
          src={Logo}
          alt="Logo"
          width={size}
          height={size}
          className="logo"
        />
      </div>
    </div>
  );
}

export default LogoAnimation;
