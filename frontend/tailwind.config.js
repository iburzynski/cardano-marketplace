module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts}"],
  theme: {
    fontFamily: {
      display: ["Silkscreen"],
      mono: ["VT323"],
    },
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};
