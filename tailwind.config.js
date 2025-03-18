/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // Paths to your template files
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6aaa64',
          dark: '#538d4e',
        },
        secondary: {
          DEFAULT: '#c9b458',
          dark: '#b59f3b',
        },
        game: {
          correct: {
            DEFAULT: '#6aaa64',
            dark: '#538d4e',
          },
          present: {
            DEFAULT: '#c9b458',
            dark: '#b59f3b',
          },
          absent: {
            DEFAULT: '#787c7e',
            dark: '#3a3a3c',
          },
          background: {
            light: '#f9fafb',
            dark: '#111827',
          },
        },
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-10px)" },
          "40%, 80%": { transform: "translateX(10px)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" }, // Scales up to 120%
          "100%": { transform: "scale(1)" }, // Scales back to original size
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        wave: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(5px)",
          },
        },
        'confetti-fall': {
          "0%": { 
            transform: "translateY(-100vh) rotate(0deg)" 
          },
          "100%": { 
            transform: "translateY(100vh) rotate(720deg)" 
          },
        },
      },
      animation: {
        shake: "shake 0.5s ease-in-out",
        pop: "pop 0.5s ease-in-out", // Added pop animation for the letters
        "gradient-xy": "gradient-xy 15s ease infinite",
        wave: "wave 10s ease-in-out infinite",
        'confetti-fall': "confetti-fall 5s linear infinite",
      },
      backgroundColor: {
        dark: '#121213', // Dark mode background color
      },
      textColor: {
        dark: '#d7dadc', // Dark mode text color
      },
    },
  },
  plugins: [],
};
