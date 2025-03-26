export const theme = {
  light: {
    primary: {
      DEFAULT: "210 100% 50%", // Bright blue (#007BFF)
      foreground: "0 0% 100%", // White
      100: "180 75% 80%", // Light blue (#AEEEEE)
      200: "195 78% 61%", // Medium light blue
      300: "210 100% 50%", // Bright blue (#007BFF)
      400: "210 100% 37%", // Medium blue (#005B96)
      500: "210 100% 30%", // Medium-dark blue
      600: "210 100% 25%", // Dark blue (#003366)
      700: "210 100% 20%", // Dark blue
      800: "210 100% 15%", // Very dark blue
      900: "210 100% 12%", // Navy blue (#001F3F)
    },
    secondary: {
      DEFAULT: "195 78% 61%", // Light blue
      foreground: "0 0% 100%",
      100: "180 75% 95%",
      200: "180 75% 80%", // Light blue (#AEEEEE)
      300: "195 78% 70%",
      400: "195 78% 61%",
      500: "195 78% 50%",
      600: "195 78% 40%",
      700: "195 78% 30%",
      800: "195 78% 20%",
      900: "195 78% 10%",
    },
    background: "0 0% 100%",
    foreground: "210 60% 10%",
  },
  dark: {
    primary: {
      DEFAULT: "180 75% 80%", // Light blue (#AEEEEE) for dark mode
      foreground: "0 0% 100%",
      100: "180 75% 80%", // Light blue (#AEEEEE)
      200: "195 78% 61%", // Medium light blue
      300: "210 100% 50%", // Bright blue (#007BFF)
      400: "210 100% 37%", // Medium blue (#005B96)
      500: "210 100% 30%", // Medium-dark blue
      600: "210 100% 25%", // Dark blue (#003366)
      700: "210 100% 20%", // Dark blue
      800: "210 100% 15%", // Very dark blue
      900: "210 100% 12%", // Navy blue (#001F3F)
    },
    secondary: {
      DEFAULT: "210 100% 50%", // Bright blue (#007BFF) for dark mode
      foreground: "0 0% 100%",
      100: "210 100% 95%",
      200: "210 100% 85%",
      300: "210 100% 75%",
      400: "210 100% 65%",
      500: "210 100% 50%", // Bright blue (#007BFF)
      600: "210 100% 37%", // Medium blue (#005B96)
      700: "210 100% 25%", // Dark blue (#003366)
      800: "210 100% 15%",
      900: "210 100% 12%", // Navy blue (#001F3F)
    },
    background: "210 100% 10%",
    foreground: "210 40% 98%",
  },
};

export const getThemeColors = (mode = 'light') => {
  return theme[mode];
};
