import React from "react";
import styled, { keyframes } from "styled-components";
const Spinning = keyframes`
 0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Ring = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  position: relative;
  top: -7px;
  margin-right: 20px;

  ::after {
    content: " ";
    display: block;
    width: 12px;
    height: 12px;
    margin: 1px;
    border-radius: 50%;
    border: 5px solid #fff;
    border-color: limegreen transparent limegreen transparent;
    animation: ${Spinning} 1s linear infinite;
  }
`;

export const ButtonLoader = () => <Ring />;
