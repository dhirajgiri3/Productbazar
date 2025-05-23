"use client"

import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: "fnt";
    src: url("/Assets/Fonts/Fontspring-DEMO-biotif-lightitalic.otf");
    font-display: swap;
  }
  @font-face {
    font-family: "fnt-bold";
    src: url("/Assets/Fonts/Fontspring-DEMO-biotif-book.otf");
    font-display: swap;
  }
  @font-face {
    font-family: "clash-bold";
    src: url("/Assets/Fonts/ClashDisplay-Bold.otf");
    font-display: swap;
  }
  @font-face {
    font-family: "clash-regular";
    src: url("/Assets/Fonts/ClashDisplay-Regular.otf");
    font-display: swap;
  }
  @font-face {
    font-family: "clash-light";
    src: url("/Assets/Fonts/ClashDisplay-Light.otf");
    font-display: swap;
  }
  @font-face {
    font-family: "clash";
    src: url("/Assets/Fonts/ClashDisplay-Variable.ttf");
    font-display: swap;
  }
`;

export default GlobalStyle;
