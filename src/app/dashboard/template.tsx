// A template remounts on every navigation (a layout does not), so each page
// settles in with a short fade. No travel: moving between sections should feel instant.
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in motion-reduce:animate-none">{children}</div>
}
