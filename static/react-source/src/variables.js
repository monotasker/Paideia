import TownMapPng from "./Images/town_map.jpg";

const urlBase = "paideia";
const recaptchaKey = "6LcLJyoaAAAAADFtQswBddP8CICf4sXENGHBKK2-"
const DEBUGGING = true;

const images = {
  $mapPng: TownMapPng,
}

// const breakpoints = {
//   $breakpointSm: "576px",
//   $breakpointMd: "768px",
//   $breakpointLg: "992px",
//   $breakpointXl: "1200px",
// }

// const colors = {
//   $blue:                  '#049cdb',
//   $blueDark:              '#1c7f99', // #006699;
//   $cranberry:             '#852625',
//   $cinnamon:              '#845852',
//   $cream:                 '#F8F0E5',
//   // $green:                 '#5BA917',
//   $green:                 '#96BC44',
//   $greenDark:             '#809240',
//   $neutralLight:          '#f2eed5',
//   $orange:                '#f89406',
//   $putty:                 '#d8d3b3',
//   $red:                   '#B10808',
//   $tapioca:               '#F2E5D4',
//   $warning:               '#a40000',
//   $wine:                  '#701',
//   $white:                 '#fff',
//   $yellow:                '#ffc40d',
// }

// const palleteColors = {
//   $palletteBG:            colors.$white,
//   $pallette1:             colors.$neutralLight,
//   $pallette2:             colors.$putty,
//   $pallette3:             colors.$green,
//   $pallette4:             colors.$greenDark,
//   $accent1:               colors.$red,
//   $accent2:               colors.$blueDark,
//   $accent3:               colors.$orange,
//   $textColor:             '#333',
//   $linkColor:             colors.$pallette2,
//   $navbarLinkColor:       colors.$pallette2,
// }

// const semanticColors = {
//   $dangerBg:        '#fcf2f2',
//   $danger:          '#bd362f', // #a84f4c; // default #dFb5b4;
//   $infoBg:          '#f0f7fd', //#d0e3f0;
//   $info:            '#5bc0de',
//   $infoDark:        '#2f96b4', // #5387B2;
//   $warningBg:       '#fefbed',
//   $warning:         colors.$orange, // #f1e7bc;
//   $error:           colors.$red,
//   $successBg:       '#dff0d8',
//   $success:         colors.$pallette3,  // #d6e9c6;
//   $successDark:     colors.$pallette4, // #d6e9c6;
// }

// const typography = {
//   $fontSizeBase:               '1rem',
//   $fontSizeLg:                 '1.25rem',
//   $sansFonts:                   '"Open Sans", sans-serif',
// }

// const Theme = {
//   images: images,
//   breakpoints: breakpoints,
//   colors: colors,
//   palleteColors: palleteColors,
//   semanticColors: semanticColors,
//   typography: typography
// }


// const saturate = x => ({saturation, ...rest}) => ({
//   ...rest,
//   saturation: Math.min(1, saturation + x),
// });

// const desaturate = x => ({saturation, ...rest}) => ({
//   ...rest,
//   saturation: Math.max(0, saturation - x),
// });

// const lighten = x => ({lightness, ...rest}) => ({
//   ...rest,
//   lightness: Math.min(1, lightness + x)
// });

// const darken = x => ({lightness, ...rest}) => ({
//   ...rest,
//   lightness: Math.max(0, lightness - x)
// });

export {
  urlBase,
  recaptchaKey,
  images,
  // breakpoints,
  // colors,
  // palleteColors,
  // semanticColors,
  // typography,
  // saturate,
  // desaturate,
  // lighten,
  // darken,
  // Theme,
  DEBUGGING
};
