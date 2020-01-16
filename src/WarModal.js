import React from "react";
import { Modal } from "./Modal";
import styled from "styled-components";

const WarP = styled.p`
  font-size: 30px;
  font-weight: 600;
  margin: 10px 0;
`;

export const WarModal = ({ startAnimation }) => (
  <Modal startAnimation={startAnimation}>
    <WarP>WAR</WarP>
  </Modal>
);
