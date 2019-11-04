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
  box-sizing: border-box;
  padding: 10px 10px 20px 10px;
  position: fixed;
  left: 50%;
  margin-left: -125px;
  border-radius: 10px;
  width: 250px;
  color: #1f2227;
  background-color: lavender;
  flex-flow: column;
  align-items: center;
  ${props =>
    props.startAnimation
      ? css`
          animation-name: ${Grow};
          display: flex;
          animation-duration: 0.2s;
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
          z-index: 100;
        `
      : css`
          display: none;
        `}
`;

export const Modal = ({ startAnimation, children }) => (
  <ModalBox startAnimation={startAnimation}>{children}</ModalBox>
);
