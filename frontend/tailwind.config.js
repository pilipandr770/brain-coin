/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'scroll-unroll': {
          '0%':   { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        'seal-pop': {
          '0%':   { transform: 'scale(0) rotate(-180deg)' },
          '70%':  { transform: 'scale(1.3) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-15px)' },
        },
        'confetti-fall': {
          '0%':   { transform: 'translateY(-100px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
      },
      animation: {
        'scroll-unroll':  'scroll-unroll 0.5s ease-out forwards',
        'seal-pop':       'seal-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'float':          'float 3s ease-in-out infinite',
        'confetti-fall':  'confetti-fall 2.5s ease-in forwards',
      },
    },
  },
  plugins: [],
};
