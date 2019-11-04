import React from "react";
import PlayingCard from "./images/rsz_card.png";

import { CardImage } from "./CardImage";
import { ImageDiv } from "./ImageDiv";

export const WarCards = ({ array, cpuWonAnimation, userWonAnimation }) => (
  <>
    {!!array.length && (
      <ImageDiv>
        {array.map(item => (
          <CardImage
            cpuWonAnimation={cpuWonAnimation}
            userWonAnimation={userWonAnimation}
            key={item.id}
            src={item.face_down ? PlayingCard : item.image}
            alt={`${item.value} of ${item.suit}`}
          />
        ))}
      </ImageDiv>
    )}
  </>
);
