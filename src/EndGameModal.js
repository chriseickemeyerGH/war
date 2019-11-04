import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import styled from "styled-components";

const DarkButton = styled(Button)`
  color: #1f2227;
  border: 1px solid #1f2227;
`;

export const EndGameModal = ({ startAnimation, gameResult, onGameRestart }) => (
  <Modal startAnimation={startAnimation}>
    <h1>You {gameResult}!</h1>
    <DarkButton onClick={onGameRestart}>Play Again</DarkButton>
  </Modal>
);
