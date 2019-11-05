import React from "react";
import styled, { keyframes, css } from "styled-components";

const slideUp = keyframes`
from {
    opacity: 1
} 
to {
  transform: translateY(-50px);
  opacity: 0
}`;

const slideDown = keyframes`
from {
    opacity: 1
    } 
to {
    transform: translateY(50px);
    opacity: 0
}`;

const IMG = styled.img`
  @media (max-width: 499px) {
    height: 85px;
  }
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
  animation-direction: normal;
  animation-fill-mode: forwards;
`;

export const CardImage = ({ ...props }) => <IMG {...props} />;
