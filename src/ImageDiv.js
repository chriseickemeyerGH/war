import React from "react";
import styled from "styled-components";

const IMGWrapper = styled.div`
  margin: 5px;
`;

export const ImageDiv = ({ children }) => <IMGWrapper>{children}</IMGWrapper>;
