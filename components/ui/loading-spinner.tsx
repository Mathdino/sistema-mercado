import Image from 'next/image'

export default function LoadingSpinner() {
  return (
    <div className="relative flex size-24 items-center justify-center">
      <div className="absolute size-full animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      <div className="absolute animate-pulse">
        <Image src="/logo-sao-jorge.png" alt="Loading..." width={87} height={87} />
      </div>
    </div>
  )
}
