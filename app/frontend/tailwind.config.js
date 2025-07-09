module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // Make sure this matches your file structure
    "./public/index.html"           // If you have any classes in your HTML template
  ],
  theme: { extend: {} },
  plugins: [],
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "types": ["vite/client", "vitest/globals", "jest", "node", "@testing-library/jest-dom"],
  },
};