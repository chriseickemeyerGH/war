import React from "react";
import { DrawnCard } from "./DrawnCard";
import { AllWarCards } from "./AllWarCards";

export const AllCards = ({ cardDrawn, startAnimation, warCardArrays }) => (
  <>
    <DrawnCard
      showCard={cardDrawn.cpu}
      src={cardDrawn.cpu.image}
      alt={`${cardDrawn.cpu.value} of ${cardDrawn.cpu.suit}`}
      cpuWonAnimation={startAnimation.cpuWon}
      userWonAnimation={startAnimation.userWon}
    />
    <AllWarCards
      startAnimation={startAnimation}
      warCardArrays={warCardArrays}
    />

    <DrawnCard
      showCard={cardDrawn.user}
      src={cardDrawn.user.image}
      alt={`${cardDrawn.user.value} of ${cardDrawn.user.suit}`}
      cpuWonAnimation={startAnimation.cpuWon}
      userWonAnimation={startAnimation.userWon}
    />
  </>
);
