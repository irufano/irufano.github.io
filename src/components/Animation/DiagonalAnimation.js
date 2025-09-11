import { animate, createScope } from "animejs";
import { useEffect, useRef, useState } from "react";
import Logo from "../../assets/irufano-square-logo.svg";
import Image from "next/image";

function DiagonalAnimation() {
  const root = useRef(null);
  const scope = useRef(null);
  const circle1Ref = useRef(null);
  const circle2Ref = useRef(null);
  const circle3Ref = useRef(null);
  const circle4Ref = useRef(null);
  const circle5Ref = useRef(null);
  const circle6Ref = useRef(null);
  const [rotations, setRotations] = useState(0);

  useEffect(() => {
    // const width = window.innerWidth;
    const width = window.innerWidth;
    const isMobile = width < 450;

    scope.current = createScope({ root }).add((self) => {
      animate(circle1Ref.current, {
        translateX: -width, // Move 100px to the right
        translateY: width,
        duration: isMobile ? 5000 : 7000,
        loop: true,
        ease: "linear",
      });

      animate(circle2Ref.current, {
        translateX: -width, // Move 100px to the right
        translateY: width,
        duration: isMobile ? 4000 : 6000,
        loop: true,
        ease: "linear",
      });

      animate(circle3Ref.current, {
        translateX: -width, // Move 100px to the right
        translateY: width,
        duration: isMobile ? 3000 : 5000,
        loop: true,
        ease: "linear",
      });

      animate(circle4Ref.current, {
        translateX: -width, // Move 100px to the right
        translateY: width,
        duration: isMobile ? 4500 : 6500,
        loop: true,
        ease: "linear",
      });

      animate(circle5Ref.current, {
        translateX: -width, // Move 100px to the right
        translateY: width,
        duration: isMobile ? 3500 : 5500,
        loop: true,
        ease: "linear",
      });
      animate(circle6Ref.current, {
        translateX: -width, // Move 100px to the right
        translateY: width,
        duration: isMobile ? 2500 : 4500,
        loop: true,
        ease: "linear",
      });
    });
  }, []);

  // const handleClick = () => {
  //   setRotations((prev) => {
  //     const newRotations = prev + 1;
  //     // Animate logo rotation on click using the method declared inside the scope
  //     scope.current.methods.rotateLogo(newRotations);
  //     return newRotations;
  //   });
  // };

  return (
    <div className="flex">
      <div ref={circle1Ref} className="h-6 w-6 bg-primary rounded-full"></div>
      <div
        ref={circle2Ref}
        className="ml-8 h-4 w-4 bg-primary rounded-full"
      ></div>
      <div
        ref={circle3Ref}
        className="ml-10 h-2 w-2 bg-primary rounded-full"
      ></div>
      <div
        ref={circle4Ref}
        className="ml-12 h-6 w-6 bg-primary rounded-full"
      ></div>
      <div
        ref={circle5Ref}
        className="ml-14 h-4 w-4 bg-primary rounded-full"
      ></div>
      <div
        ref={circle6Ref}
        className="ml-6 h-6 w-6 bg-primary rounded-full"
      ></div>
    </div>
  );
}

export default DiagonalAnimation;
