type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-16 h-16 border-4',
}

export default function Spinner({ size = 'md', fullScreen = false }: SpinnerProps) {
  const spinner = (
    <div
      className={`
        ${sizeClasses[size]}
        border-emerald-600 border-t-transparent rounded-full animate-spin
      `}
    />
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {spinner}
      </div>
    )
  }

  return spinner
}
