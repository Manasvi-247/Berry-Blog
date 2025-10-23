// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fdf8f6",
          100: "#f9f1ed",
          200: "#f3e4db",
        },
        // Dark mode colors
        dark: {
          bg: "#0a0a0a", // Black background
          card: "#1a0f1a", // Dark purple
          border: "#e8d5f2", // Light lilac
          text: "#f8f4ff", // Very light text
          muted: "#a78bfa", // Muted purple
        },
      },
    },
  },
  plugins: [],
};
