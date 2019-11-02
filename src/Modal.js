import React from "react";
import styled, { keyframes, css } from "styled-components";

const Grow = keyframes`
from {
transform: scale(0)
}
to {
transform: scale(1)
}
`;

const ModalBox = styled.div`
  top: 30%;
  position: fixed;
  left: 50%;
  margin-left: -150px;
  border-radius: 10px;
  width: 300px;
  color: #1f2227;

  background-color: lavender;
  ${props =>
    props.startAnimation
      ? css`
          animation-name: ${Grow};
          display: block;
          animation-duration: 0.2s;
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
          z-index: 100;
        `
      : css`
          display: none;
        `}
`;

export const Modal = ({ startAnimation, text }) => (
  <ModalBox startAnimation={startAnimation}>
    <h1>{text}</h1>
  </ModalBox>
);
