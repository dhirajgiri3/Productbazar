/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./Components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Color classes for DashboardPreview component
    {
      pattern: /^(bg|text|border|from|to)-(indigo|violet|emerald|amber|blue|slate)-(50|100|200|300|400|500|600|700|800)$/,
    },
    {
      pattern: /^(bg|text|border)-(indigo|violet|emerald|amber|blue|slate)-(50|100|200|300|400|500|600|700|800)\/(20|30|40|50|60|70|80|90)$/,
    },
    // Hover and group hover states
    'hover:bg-indigo-100', 'hover:bg-indigo-200', 'hover:bg-violet-100', 'hover:bg-violet-200',
    'hover:bg-emerald-100', 'hover:bg-emerald-200', 'hover:bg-amber-100', 'hover:bg-amber-200',
    'hover:bg-blue-100', 'hover:bg-blue-200', 'hover:bg-slate-100', 'hover:bg-slate-200',
    'hover:text-violet-600', 'hover:text-indigo-600', 'hover:text-emerald-600',
    'group-hover:bg-violet-300/35', 'group-hover:bg-indigo-300/35', 'group-hover:bg-blue-300/35',
    'group-hover:text-violet-600', 'group-hover:text-indigo-600', 'group-hover:text-emerald-600',
    // Opacity variants
    {
      pattern: /^(bg|text|border)-(indigo|violet|emerald|amber|blue|slate)-(50|100|200|300|400|500|600|700|800)\/(10|20|30|40|50|60|70|80|90)$/,
    },
    // Specific classes used in the component
    'bg-red-500', 'bg-yellow-500', 'bg-green-500',
    'text-violet-600', 'text-violet-500', 'text-violet-700', 'text-violet-800',
    'bg-violet-100', 'bg-violet-50', 'bg-violet-500', 'bg-violet-600',
    'border-violet-200', 'border-violet-300', 'border-violet-400',
    'from-violet-500', 'to-violet-400', 'to-purple-600',
    'bg-emerald-100', 'text-emerald-500', 'text-emerald-600',
    'bg-indigo-100', 'text-indigo-500', 'text-indigo-600',
    'bg-amber-100', 'text-amber-500', 'text-amber-600',
    'bg-blue-100', 'text-blue-500', 'text-blue-600',
    'bg-slate-100', 'text-slate-500', 'text-slate-600',
    // Gradient classes
    'bg-gradient-to-r', 'bg-gradient-to-br', 'bg-gradient-to-l',
    // Shadow classes
    'shadow-violet-300/50', 'shadow-violet-300/20', 'shadow-emerald-300/50',
    // Ring classes
    'ring-violet-400', 'ring-violet-500',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        border: "var(--border)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'gradient-x': 'gradient-x 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  }
};