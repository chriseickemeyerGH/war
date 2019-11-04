import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  body {
    background-color:  #1f2227;
    font-family: "Nirmala UI";
    color: #F8F8F8;
    text-align: center;
    display: flex;
     flex-flow: column; 
     align-items: center;
  }
  p {
      line-height: 1.6;
  }
 
`;
