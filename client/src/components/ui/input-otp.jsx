import { cn } from "@/lib/utils"

function InputOTP({
  value,
  onChange,
  maxLength = 4,
  className,
  ...props
}) {
  const handleChange = (event) => {
    const nextValue = event.target.value.replace(/\D/g, "").slice(0, maxLength)
    onChange?.(nextValue)
  }

  return (
    <input
      data-slot="input-otp"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={maxLength}
      value={value}
      onChange={handleChange}
      className={cn(
        "h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 text-center text-2xl tracking-[0.55em] text-zinc-100 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/30",
        className
      )}
      {...props}
    />
  )
}

export { InputOTP }
