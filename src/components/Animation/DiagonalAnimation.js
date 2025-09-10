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
  const [rotations, setRotations] = useState(0);

  useEffect(() => {
    scope.current = createScope({ root }).add((self) => {
      animate(circle1Ref.current, {
        translateX: -window.innerWidth, // Move 100px to the right
        translateY: window.innerWidth,
        duration: 5000,
        loop: true,
        ease: "linear",
      });

      animate(circle2Ref.current, {
        translateX: -window.innerWidth, // Move 100px to the right
        translateY: window.innerWidth,
        duration: 4000,
        loop: true,
        ease: "linear",
      });

      animate(circle3Ref.current, {
        translateX: -window.innerWidth, // Move 100px to the right
        translateY: window.innerWidth,
        duration: 3000,
        loop: true,
        ease: "linear",
      });

      animate(circle4Ref.current, {
        translateX: -window.innerWidth, // Move 100px to the right
        translateY: window.innerWidth,
        duration: 4500,
        loop: true,
        ease: "linear",
      });

      animate(circle5Ref.current, {
        translateX: -window.innerWidth, // Move 100px to the right
        translateY: window.innerWidth,
        duration: 3500,
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
    <div className="medium row">
      <div ref={circle1Ref} className="h-6 w-6 bg-primary rounded-full"></div>
      <div
        ref={circle2Ref}
        className="ml-10 h-4 w-4 bg-primary rounded-full"
      ></div>
      <div
        ref={circle3Ref}
        className="ml-14 h-2 w-2 bg-primary rounded-full"
      ></div>
      <div
        ref={circle4Ref}
        className="ml-16 h-6 w-6 bg-primary rounded-full"
      ></div>
      <div
        ref={circle5Ref}
        className="ml-24 h-4 w-4 bg-primary rounded-full"
      ></div>
    </div>
  );
}

export default DiagonalAnimation;
