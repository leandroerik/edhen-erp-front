interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none'
  const sizes = { sm: 'h-8 px-2.5 text-xs', md: 'px-4 py-2 text-sm' }
  const variants = {
    primary: 'bg-amber-700 text-white hover:bg-amber-800',
    secondary: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
    ghost: 'text-stone-700 hover:bg-stone-100',
    danger: 'bg-red-700 text-white hover:bg-red-800',
  }
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
}
