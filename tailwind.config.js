/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
    ],

    theme: {
        extend: {
            colors: {
                obsidian: '#0A0C0E',
                gunmetal: '#14171C',
                steel: '#1F242B',
                'imperial-red': '#DC2626',
                amber: '#F59E0B',
                'data-blue': '#3B82F6',
            },

            fontFamily: {
                ibm: ['var(--font-ibm)'],
                exo: ['var(--font-exo)'],
                chakra: ['var(--font-chakra)'],
                'share-tech': ['var(--font-share-tech)'],
                'star-jedi': ['"Star Jedi"', 'sans-serif'],
            },

            animation: {
                'pulse-slow':
                    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                scan: 'scan 2s linear infinite',
                'flash-red': 'flash 0.3s ease-in-out',
            },

            keyframes: {
                scan: {
                    '0%': {
                        transform: 'translateX(-100%)',
                    },
                    '100%': {
                        transform: 'translateX(100%)',
                    },
                },

                flash: {
                    '0%': {
                        backgroundColor: 'rgba(220, 38, 38, 0)',
                    },
                    '50%': {
                        backgroundColor: 'rgba(220, 38, 38, 0.4)',
                    },
                    '100%': {
                        backgroundColor: 'rgba(220, 38, 38, 0)',
                    },
                },
            },
        },
    },

    plugins: [],
}