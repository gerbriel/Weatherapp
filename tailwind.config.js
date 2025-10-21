/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // GitHub-inspired color palette
        github: {
          // Light theme colors
          canvas: {
            default: '#ffffff',
            overlay: '#f6f8fa',
            inset: '#f6f8fa',
            subtle: '#f6f8fa',
          },
          fg: {
            default: '#1f2328',
            muted: '#656d76',
            subtle: '#6e7781',
            onEmphasis: '#ffffff',
          },
          border: {
            default: '#d1d9e0',
            muted: '#d8dee4',
            subtle: '#afb8c1',
          },
          neutral: {
            emphasis: '#6e7781',
            emphasisPlus: '#656d76',
            muted: 'rgba(175, 184, 193, 0.2)',
            subtle: 'rgba(175, 184, 193, 0.1)',
          },
          accent: {
            emphasis: '#0969da',
            fg: '#0969da',
            muted: 'rgba(84, 174, 255, 0.4)',
            subtle: 'rgba(84, 174, 255, 0.15)',
          },
          success: {
            emphasis: '#1a7f37',
            fg: '#1a7f37',
            muted: 'rgba(74, 194, 107, 0.4)',
            subtle: 'rgba(74, 194, 107, 0.15)',
          },
          attention: {
            emphasis: '#9a6700',
            fg: '#9a6700',
            muted: 'rgba(212, 167, 44, 0.4)',
            subtle: 'rgba(212, 167, 44, 0.15)',
          },
          severe: {
            emphasis: '#bc4c00',
            fg: '#bc4c00',
            muted: 'rgba(255, 135, 67, 0.4)',
            subtle: 'rgba(255, 135, 67, 0.15)',
          },
          danger: {
            emphasis: '#d1242f',
            fg: '#d1242f',
            muted: 'rgba(255, 129, 130, 0.4)',
            subtle: 'rgba(255, 129, 130, 0.15)',
          },
        },
        // Dark theme colors
        'github-dark': {
          canvas: {
            default: '#0d1117',
            overlay: '#161b22',
            inset: '#010409',
            subtle: '#161b22',
          },
          fg: {
            default: '#e6edf3',
            muted: '#7d8590',
            subtle: '#6e7681',
            onEmphasis: '#ffffff',
          },
          border: {
            default: '#30363d',
            muted: '#21262d',
            subtle: '#484f58',
          },
          neutral: {
            emphasis: '#6e7681',
            emphasisPlus: '#7d8590',
            muted: 'rgba(110, 118, 129, 0.4)',
            subtle: 'rgba(110, 118, 129, 0.1)',
          },
          accent: {
            emphasis: '#2f81f7',
            fg: '#2f81f7',
            muted: 'rgba(56, 139, 253, 0.4)',
            subtle: 'rgba(56, 139, 253, 0.15)',
          },
          success: {
            emphasis: '#3fb950',
            fg: '#3fb950',
            muted: 'rgba(46, 160, 67, 0.4)',
            subtle: 'rgba(46, 160, 67, 0.15)',
          },
          attention: {
            emphasis: '#d29922',
            fg: '#d29922',
            muted: 'rgba(187, 128, 9, 0.4)',
            subtle: 'rgba(187, 128, 9, 0.15)',
          },
          severe: {
            emphasis: '#da7633',
            fg: '#da7633',
            muted: 'rgba(181, 118, 20, 0.4)',
            subtle: 'rgba(181, 118, 20, 0.15)',
          },
          danger: {
            emphasis: '#f85149',
            fg: '#f85149',
            muted: 'rgba(248, 81, 73, 0.4)',
            subtle: 'rgba(248, 81, 73, 0.15)',
          },
        }
      },
      fontFamily: {
        mono: ['SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'gh': '6px',
      },
      boxShadow: {
        'gh-sm': '0 1px 0 rgba(27, 31, 36, 0.04)',
        'gh': '0 8px 24px rgba(140, 149, 159, 0.2)',
        'gh-lg': '0 16px 32px rgba(140, 149, 159, 0.2)',
      }
    },
  },
  plugins: [],
}