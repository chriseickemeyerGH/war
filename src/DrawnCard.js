import React from "react";
import styled from "styled-components";
import Pic from "./images/rsz_card.png";
import { CardImage } from "./CardImage";
import { ImageDiv } from "./ImageDiv";

const EmptyPic = styled.img`
  height: 100px;
  visibility: hidden;
`;

export const DrawnCard = ({
  showCard,
  src,
  alt,
  cpuWonAnimation,
  userWonAnimation
}) => (
  <ImageDiv>
    {showCard ? (
      <CardImage
        cpuWonAnimation={cpuWonAnimation}
        userWonAnimation={userWonAnimation}
        src={src}
        alt={alt}
      />
    ) : (
      <EmptyPic src={Pic} />
    )}
  </ImageDiv>
);
