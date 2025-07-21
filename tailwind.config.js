// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb", // blue-600
          dark: "#1d4ed8", // blue-700
        },
        secondary: {
          DEFAULT: "#7c3aed", // purple-600
          dark: "#6d28d9", // purple-700
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"), // If using form elements
    require("@tailwindcss/typography"), // If using prose
  ],
};
