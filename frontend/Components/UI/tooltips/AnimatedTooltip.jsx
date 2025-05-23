import React, { useState } from "react";
import
    {
        motion,
        useTransform,
        AnimatePresence,
        useMotionValue,
        useSpring,
    } from "framer-motion";
import styled from "styled-components";

const TooltipContainer = styled(motion.div)`
  position: absolute;
  top: -4rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: black;
  color: white;
  z-index: 50;
  box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1),
    0px 4px 6px -2px rgba(0, 0, 0, 0.05);
  white-space: nowrap;

  &::before {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 50%;
    width: 20%;
    height: 1px;
    background: linear-gradient(to right, transparent, #34d399, transparent);
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 25%;
    width: 40%;
    height: 1px;
    background: linear-gradient(to right, transparent, #0ea5e9, transparent);
  }
`;

const PersonContainer = styled.div`
  position: relative;
  margin-right: -1rem;
  display: inline-block;
  transition: transform 0.5s;
  &:hover {
    z-index: 30;
    transform: scale(1.05);
  }
`;

const Avatar = styled.img`
  border-radius: 50%;
  border: 2px solid white;
  height: 2.8rem;
  width: 2.8rem;
  object-fit: cover;
`;

export const AnimatedTooltip = ({ items }) =>
{
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const springConfig = { stiffness: 100, damping: 5 };
    const x = useMotionValue(0);
    const rotate = useSpring(
        useTransform(x, [-100, 100], [-45, 45]),
        springConfig
    );
    const translateX = useSpring(
        useTransform(x, [-100, 100], [-50, 50]),
        springConfig
    );

    const handleMouseMove = (event) =>
    {
        const halfWidth = event.target.offsetWidth / 2;
        x.set(event.nativeEvent.offsetX - halfWidth);
    };

    return (
        <>
            {items.map((item) => (
                <PersonContainer
                    key={item.name}
                    onMouseEnter={() => setHoveredIndex(item.id)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <AnimatePresence>
                        {hoveredIndex === item.id && (
                            <TooltipContainer
                                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                                style={{ translateX, rotate }}
                            >
                                <div>{item.name}</div>
                                <div>{item.designation}</div>
                            </TooltipContainer>
                        )}
                    </AnimatePresence>
                    <Avatar
                        onMouseMove={handleMouseMove}
                        height={100}
                        width={100}
                        src={item.image}
                        alt={item.name}
                    />
                </PersonContainer>
            ))}
        </>
    );
};
