export const theme = {
  light: {
    primary: {
      DEFAULT: "271 56% 63%", // Purple (#A06CD5)
      foreground: "0 0% 100%", // White
      100: "271 56% 90%", // Light purple
      200: "271 56% 80%", // Medium light purple
      300: "271 56% 70%", // Medium purple
      400: "271 56% 63%", // Main purple (#A06CD5)
      500: "271 56% 55%", // Medium-dark purple
      600: "271 56% 45%", // Dark purple
      700: "271 56% 35%", // Darker purple
      800: "271 56% 25%", // Very dark purple
      900: "271 56% 15%", // Near black purple
    },
    secondary: {
      DEFAULT: "246 100% 96%", // Light Lavender background (#F6F0FB)
      foreground: "214 61% 15%", // Dark text (#102B3F)
      100: "246 100% 98%",
      200: "246 100% 96%", // Light Lavender (#F6F0FB)
      300: "246 100% 90%",
      400: "246 100% 85%",
      500: "246 100% 80%",
      600: "246 100% 70%",
      700: "246 100% 60%",
      800: "246 100% 50%",
      900: "246 100% 40%",
    },
    tertiary: {
      DEFAULT: "35 81% 58%", // Gold / CTA (#EFA738)
      foreground: "0 0% 100%", // White
      100: "35 81% 90%",
      200: "35 81% 80%",
      300: "35 81% 70%",
      400: "35 81% 58%", // Gold (#EFA738)
      500: "35 81% 50%",
      600: "35 81% 40%",
      700: "35 81% 30%",
      800: "35 81% 20%",
      900: "35 81% 10%",
    },
    background: "0 0% 100%", // White (#FFFFFF)
    foreground: "214 61% 15%", // Dark text (#102B3F)
  },
  dark: {
    primary: {
      DEFAULT: "0 0% 100%", // White text header in dark mode (#FFFFFF)
      foreground: "0 0% 100%", // White
      100: "0 0% 100%", // White
      200: "0 0% 90%",
      300: "0 0% 80%",
      400: "0 0% 70%",
      500: "0 0% 60%",
      600: "0 0% 50%",
      700: "0 0% 40%",
      800: "0 0% 30%",
      900: "0 0% 20%",
    },
    secondary: {
      DEFAULT: "271 56% 63%", // Purple (#A06CD5)
      foreground: "0 0% 100%", // White
      100: "271 56% 90%",
      200: "271 56% 80%",
      300: "271 56% 70%",
      400: "271 56% 63%", // Main purple (#A06CD5)
      500: "271 56% 55%",
      600: "271 56% 45%",
      700: "271 56% 35%",
      800: "271 56% 25%",
      900: "271 56% 15%",
    },
    tertiary: {
      DEFAULT: "35 81% 58%", // Gold / CTA (#EFA738)
      foreground: "0 0% 100%", // White
      100: "35 81% 90%",
      200: "35 81% 80%",
      300: "35 81% 70%",
      400: "35 81% 58%", // Gold (#EFA738)
      500: "35 81% 50%",
      600: "35 81% 40%",
      700: "35 81% 30%",
      800: "35 81% 20%",
      900: "35 81% 10%",
    },
    background: "214 61% 15%", // Dark background (#102B3F)
    foreground: "0 0% 100%", // White text
  },
};

export const getThemeColors = (mode = 'light') => {
  return theme[mode];
};
