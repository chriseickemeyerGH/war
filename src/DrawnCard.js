import React from "react";
import styled, { keyframes, css } from "styled-components";

const slideUp = keyframes`
from {
  position: relative;
opacity: 1
} 
to {
  position: relative;
  transform: translateY(-50px);
  opacity: 0
}
`;
const slideDown = keyframes`
from {
  position: relative;
opacity: 1
} 
to {
  position: relative;
  transform: translateY(50px);
opacity: 0
}
`;

const IMG = styled.img`
  height: 100px;
  animation-name: ${props =>
    props.cpuWonAnimation
      ? css`
          ${slideUp}
        `
      : ""};
  animation-name: ${props =>
    props.userWonAnimation
      ? css`
          ${slideDown}
        `
      : ""};

  animation-duration: 0.3s;
  animation-timing-function: ease-out;
  animation-delay: 0s;
  animation-direction: normal;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
  /*  animation-play-state: running; */
`;

export const DrawnCard = ({
  showCard,
  src,
  alt,
  cpuWonAnimation,
  userWonAnimation
}) => (
  <>
    {showCard && (
      <IMG
        cpuWonAnimation={cpuWonAnimation}
        userWonAnimation={userWonAnimation}
        src={src}
        alt={alt}
      />
    )}
  </>
);
