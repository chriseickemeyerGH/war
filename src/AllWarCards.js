import React from "react";
import { WarCards } from "./WarCards";

export const AllWarCards = ({ startAnimation, warCardArrays }) => (
  <>
    <WarCards
      array={warCardArrays.cpu}
      cpuWonAnimation={startAnimation.cpuWon}
      userWonAnimation={startAnimation.userWon}
    />

    <WarCards
      array={warCardArrays.user}
      cpuWonAnimation={startAnimation.cpuWon}
      userWonAnimation={startAnimation.userWon}
    />
  </>
);
