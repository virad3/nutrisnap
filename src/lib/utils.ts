import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const round = (n: number, d = 0) => {
  const f = 10 ** d
  return Math.round((n + Number.EPSILON) * f) / f
}
