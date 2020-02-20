import React from "react";
import styled from "styled-components";
import { Button } from "./Button";

const CenterButton = styled.div`
  text-align: center;
  margin: 20px;
`;

const SourceLink = styled.a`
  color: lightblue;
  text-decoration: none;
  :visited {
    color: lightblue;
  }
  display: block;
`;
const InstructionDiv = styled.div`
  padding: 20px;
  border: 1px solid #f8f8f8;
  text-align: left;
  margin: auto;
  max-width: 500px;
  > h1 {
    text-align: center;
    margin-bottom: 30px;
  }
`;

export const Instructions = ({ onStart, loading }) => (
  <InstructionDiv>
    <h1>The Game of War</h1>
    <h3>How to play:</h3>
    <p>The goal is to be the first player to win all 52 cards </p>
    <h3>THE DEAL</h3>
    <p>
      The deck is divided evenly, with each player receiving 26 cards, dealt one
      at a time, face down. Anyone may deal first. Each player places their
      stack of cards face down, in front of them.
    </p>
    <h3>THE PLAY</h3>
    <p>
      Each player turns up a card at the same time and the player with the
      higher card takes both cards and puts them, face down, on the bottom of
      his stack. If the cards are the same rank, it is War. Each player turns up
      one card face down and one card face up. The player with the higher cards
      takes both piles (six cards). If the turned-up cards are again the same
      rank, each player places another card face down and turns another card
      face up. The player with the higher card takes all 10 cards, and so on.
    </p>
    <h3>HOW TO KEEP SCORE</h3>
    <p>The game ends when one player has won all the cards.</p>
    <SourceLink href="https://bicyclecards.com/how-to-play/war/">
      Source
    </SourceLink>
    <CenterButton>
      <Button onClick={onStart}>Start</Button>
    </CenterButton>
  </InstructionDiv>
);
