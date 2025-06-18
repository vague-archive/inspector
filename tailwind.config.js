/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,ts}",
    "./node_modules/@vaguevoid/design-system/src/component/*.ts",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  presets: [require("@vaguevoid/design-system/preset")],
};
