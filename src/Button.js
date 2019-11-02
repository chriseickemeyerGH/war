import React from "react";
import styled from "styled-components";
const StyledButton = styled.button`
  font-size: 16px;
  border: 1px solid lavender;
  padding: 16px;
  background-color: transparent;
  color: lavender;

  border-radius: 10px;
  :hover {
    background-color: lavender;
    color: #1f2227;
    cursor: pointer;
  }
  :disabled {
    cursor: default;
    opacity: 0.5;
    background-color: lavender;
    color: #1f2227;
  }
`;
export const Button = ({ ...props }) => <StyledButton {...props} />;
