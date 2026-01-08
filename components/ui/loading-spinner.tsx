import Image from 'next/image'

export default function LoadingSpinner() {
  return (
    <div className="relative flex size-24 items-center justify-center">
      <div className="absolute size-full animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      <Image src="/icon.svg" alt="Loading..." width={48} height={48} />
    </div>
  )
}
