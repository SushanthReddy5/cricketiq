/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        srh: {
          orange:  '#FF6B00',
          red:     '#E30613',
          gold:    '#FFD700',
          dark:    '#0A0A0A',
          card:    '#141414',
          cardHov: '#1E1E1E',
          border:  '#2A2A2A',
          text:    '#F5F5F5',
          muted:   '#888888',
          win:     '#00E676',
          loss:    '#FF1744',
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease both',
        'fade-in':    'fadeIn 0.5s ease both',
        'slide-left': 'slideLeft 0.6s ease both',
        'slide-right':'slideRight 0.6s ease both',
        'pulse-slow': 'pulse 3s ease infinite',
      },
      keyframes: {
        fadeUp:     { from:{ opacity:0, transform:'translateY(30px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        fadeIn:     { from:{ opacity:0 }, to:{ opacity:1 } },
        slideLeft:  { from:{ opacity:0, transform:'translateX(40px)' }, to:{ opacity:1, transform:'translateX(0)' } },
        slideRight: { from:{ opacity:0, transform:'translateX(-40px)' }, to:{ opacity:1, transform:'translateX(0)' } },
      },
      boxShadow: {
        'srh':       '0 4px 20px rgba(255,107,0,0.15)',
        'srh-hover': '0 8px 32px rgba(255,107,0,0.30)',
        'card':      '0 4px 12px rgba(0,0,0,0.4)',
        'card-hover':'0 12px 32px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
