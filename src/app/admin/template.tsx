// Same short fade as the member area on every admin navigation
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in motion-reduce:animate-none">{children}</div>
}
