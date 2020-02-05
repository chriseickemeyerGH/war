import React from "react";
import { AllCards } from "./AllCards";

export const GameTable = ({
  cardsLeft,
  cardDrawn,
  warCardArrays,
  startAnimation,
  drawButton,
  gameStart,
  widthOver1000
}) => (
  <>
    <p>Deck: {cardsLeft.cpu}</p>
    <h2>CPU</h2>
    <AllCards
      cardDrawn={cardDrawn}
      warCardArrays={warCardArrays}
      startAnimation={startAnimation}
    />
    <h2>You</h2>
    <p>Deck: {cardsLeft.user}</p>
    {drawButton}
    {!gameStart && widthOver1000 && (
      <p>Click or Press "Enter" / "Space" to draw</p>
    )}
  </>
);
