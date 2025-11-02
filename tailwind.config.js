/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'secondary-button-bg': 'var(--color-secondary-button-bg)',
        'secondary-button-text': 'var(--color-secondary-button-text)',
        'secondary-button-border': 'var(--color-secondary-button-border)',
        'secondary-button-hover-bg': 'var(--color-secondary-button-hover-bg)',
        'secondary-button-hover-text': 'var(--color-secondary-button-hover-text)',
        'primary-button-bg': 'var(--color-primary-button-bg)',
        'primary-button-text': 'var(--color-primary-button-text)',
        'primary-button-border': 'var(--color-primary-button-border)',
        'primary-button-hover-bg': 'var(--color-primary-button-hover-bg)',
        'primary-button-hover-text': 'var(--color-primary-button-hover-text)',
        'cancel-button-bg': 'var(--color-cancel-button-bg)',
        'cancel-button-text': 'var(--color-cancel-button-text)',
        'cancel-button-border': 'var(--color-cancel-button-border)',
        'cancel-button-hover-bg': 'var(--color-cancel-button-hover-bg)',
        'cancel-button-hover-text': 'var(--color-cancel-button-hover-text)',
      },
    },
  },
  plugins: [],
}
