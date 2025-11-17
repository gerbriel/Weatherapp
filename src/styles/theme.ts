/**
 * Centralized Theme Configuration
 * Use this file to manage all styling tokens for easier updates
 */

export const theme = {
  // Color Palette
  colors: {
    // Primary brand colors
    primary: {
      50: 'bg-blue-50 dark:bg-blue-950',
      100: 'bg-blue-100 dark:bg-blue-900',
      500: 'bg-blue-500 dark:bg-blue-600',
      600: 'bg-blue-600 dark:bg-blue-500',
      700: 'bg-blue-700 dark:bg-blue-400',
    },
    
    // Background colors
    background: {
      primary: 'bg-white dark:bg-gray-800',
      secondary: 'bg-gray-50 dark:bg-gray-900',
      tertiary: 'bg-gray-100 dark:bg-gray-800',
      elevated: 'bg-white dark:bg-gray-700',
      card: 'bg-white dark:bg-gray-800',
      cardHover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
      input: 'bg-white dark:bg-gray-700',
      // Additional patterns found in codebase
      accent: 'bg-gray-50 dark:bg-gray-700',
      accentHover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
      muted: 'bg-gray-50 dark:bg-gray-800/50',
      sidebar: 'bg-white dark:bg-gray-800',
      header: 'bg-white dark:bg-gray-800',
      overlay: 'bg-gray-900/80 dark:bg-gray-950/90',
      modal: 'bg-white dark:bg-gray-800',
      dropdown: 'bg-white dark:bg-gray-800',
      // Light mode specific backgrounds that need better contrast
      lightCard: 'bg-gray-50 dark:bg-gray-800',
      lightSection: 'bg-gray-100 dark:bg-gray-900',
    },
    
    // Text colors
    text: {
      primary: 'text-gray-900 dark:text-white',
      secondary: 'text-gray-600 dark:text-gray-300',
      tertiary: 'text-gray-500 dark:text-gray-400',
      muted: 'text-gray-400 dark:text-gray-500',
      inverse: 'text-white dark:text-gray-900',
      link: 'text-blue-600 dark:text-blue-400',
      linkHover: 'hover:text-blue-700 dark:hover:text-blue-300',
    },
    
    // Border colors
    border: {
      default: 'border-gray-200 dark:border-gray-700',
      light: 'border-gray-100 dark:border-gray-800',
      medium: 'border-gray-300 dark:border-gray-600',
      focus: 'focus:border-blue-500 dark:focus:border-blue-400',
      // Colored borders for different contexts
      primary: 'border-blue-500 dark:border-blue-400',
      success: 'border-green-500 dark:border-green-400',
      warning: 'border-yellow-500 dark:border-yellow-400',
      error: 'border-red-500 dark:border-red-400',
      info: 'border-blue-500 dark:border-blue-400',
    },
    
    // Status colors
    status: {
      success: 'text-green-600 dark:text-green-400',
      successBg: 'bg-green-50 dark:bg-green-900/20',
      warning: 'text-yellow-600 dark:text-yellow-400',
      warningBg: 'bg-yellow-50 dark:bg-yellow-900/20',
      error: 'text-red-600 dark:text-red-400',
      errorBg: 'bg-red-50 dark:bg-red-900/20',
      info: 'text-blue-600 dark:text-blue-400',
      infoBg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    
    // Metric card colors
    metrics: {
      high: 'text-red-500 dark:text-red-400',
      low: 'text-blue-500 dark:text-blue-400',
      precip: 'text-cyan-400 dark:text-cyan-300',
      et0: 'text-orange-400 dark:text-orange-300',
      et0Sum: 'text-amber-400 dark:text-amber-300',
      etcActual: 'text-purple-400 dark:text-purple-300',
      // Additional metric colors for better contrast in light mode
      highBg: 'bg-red-50 dark:bg-red-900/20',
      lowBg: 'bg-blue-50 dark:bg-blue-900/20',
      precipBg: 'bg-cyan-50 dark:bg-cyan-900/20',
      et0Bg: 'bg-orange-50 dark:bg-orange-900/20',
      temperature: 'text-orange-600 dark:text-orange-400',
      humidity: 'text-blue-600 dark:text-blue-400',
      wind: 'text-gray-600 dark:text-gray-400',
    },
  },
  
  // Component Styles
  components: {
    // Button styles
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
      danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white',
      // Additional button variants
      success: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white',
      warning: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white',
      outline: 'bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
      // Disabled state
      disabled: 'opacity-50 cursor-not-allowed',
    },
    
    // Card styles
    card: {
      base: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm',
      compact: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
      elevated: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md',
      header: 'bg-gray-800 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',
      headerHover: 'hover:bg-gray-750 dark:hover:bg-gray-850',
    },
    
    // Metric card styles
    metricCard: {
      base: 'bg-gray-200 dark:bg-gray-900 p-2 rounded border border-gray-300 dark:border-gray-700',
      label: 'text-[10px] font-medium text-gray-600 dark:text-gray-400 uppercase',
      value: 'text-sm font-bold text-gray-900 dark:text-white',
      // Compact version for tighter layouts
      compact: 'bg-gray-100 dark:bg-gray-900 p-1.5 rounded border border-gray-200 dark:border-gray-700',
      // Elevated version with more prominent styling
      elevated: 'bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
    },
    
    // Input styles
    input: {
      base: 'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
      select: 'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
    },
    
    // Table styles
    table: {
      header: 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-medium text-left',
      row: 'border-b border-gray-200 dark:border-gray-700',
      cell: 'px-4 py-3 text-gray-900 dark:text-white',
      cellSecondary: 'px-4 py-3 text-gray-600 dark:text-gray-300',
    },
    
    // Navigation styles
    nav: {
      tab: 'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
      tabActive: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm',
      tabInactive: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700',
    },
    
    // Section styles
    section: {
      header: 'flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800',
      headerCompact: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800',
      content: 'p-6 bg-white dark:bg-gray-800',
      // Additional section patterns
      headerLight: 'px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',
      contentAlt: 'p-6 bg-gray-50 dark:bg-gray-900',
      divider: 'border-t border-gray-200 dark:border-gray-700',
    },
    
    // Modal/Dialog styles  
    modal: {
      overlay: 'fixed inset-0 bg-gray-900/50 dark:bg-gray-950/70 flex items-center justify-center z-50',
      container: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4',
      header: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
      content: 'p-6',
      footer: 'px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg',
    },
    
    // Dropdown/Menu styles
    dropdown: {
      container: 'absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50',
      item: 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
      itemActive: 'bg-gray-100 dark:bg-gray-700',
      divider: 'border-t border-gray-200 dark:border-gray-700 my-1',
    },
  },
  
  // Spacing
  spacing: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
  
  // Border Radius
  radius: {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  },
  
  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  },
  
  // Typography
  typography: {
    h1: 'text-2xl font-bold text-gray-900 dark:text-white',
    h2: 'text-xl font-semibold text-gray-900 dark:text-white',
    h3: 'text-lg font-semibold text-gray-900 dark:text-white',
    h4: 'text-base font-semibold text-gray-900 dark:text-white',
    body: 'text-sm text-gray-600 dark:text-gray-300',
    bodyLarge: 'text-base text-gray-600 dark:text-gray-300',
    caption: 'text-xs text-gray-500 dark:text-gray-400',
    label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
    // Additional typography styles
    small: 'text-xs text-gray-600 dark:text-gray-400',
    tiny: 'text-[10px] text-gray-500 dark:text-gray-500',
    lead: 'text-lg text-gray-700 dark:text-gray-200',
    muted: 'text-sm text-gray-500 dark:text-gray-400',
  },
  
  // Utility patterns - common class combinations
  utils: {
    // Scroll containers
    scroll: 'overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700',
    scrollX: 'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700',
    scrollY: 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700',
    
    // Focus rings
    focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
    focusRingInset: 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:focus:ring-blue-400',
    
    // Transitions
    transition: 'transition-colors duration-200',
    transitionAll: 'transition-all duration-200',
    transitionFast: 'transition-colors duration-150',
    
    // Common dividers
    dividerX: 'divide-x divide-gray-200 dark:divide-gray-700',
    dividerY: 'divide-y divide-gray-200 dark:divide-gray-700',
    
    // Flex/Grid helpers
    centerFlex: 'flex items-center justify-center',
    centerBetween: 'flex items-center justify-between',
    centerStart: 'flex items-center justify-start',
    centerEnd: 'flex items-center justify-end',
    
    // Loading/Skeleton
    skeleton: 'animate-pulse bg-gray-200 dark:bg-gray-700',
    spinner: 'animate-spin',
    
    // Truncate text
    truncate: 'truncate',
    lineClamp2: 'line-clamp-2',
    lineClamp3: 'line-clamp-3',
  },
} as const;

// Helper function to combine class names
export const cn = (...classes: (string | boolean | undefined | null)[]) => {
  return classes.filter(Boolean).join(' ');
};
