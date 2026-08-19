import Link from 'next/link'
import { Button } from '@/components/ui'
import { Music, Users, Calendar, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/ibglogo.png" alt="IBG Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-primary">Alabanza IBG</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-primary">
                Iniciar Sesión
              </Link>
              <Link href="/register">
                <Button>Registrarse</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Organiza tu <span className="text-primary">Ministerio de Alabanza</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Gestiona eventos, asignaciones y listas de alabanzas de forma sencilla.
                Cada cantante tiene su perfil, recibe notificaciones y puede enviar sus listas por WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    <Users className="w-5 h-5" />
                    Comenzar Gratis
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-secondary/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Todo lo que necesitas para tu ministerio
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Funciones diseñadas específicamente para equipos de alabanza
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Calendar className="w-6 h-6" />}
                title="Gestión de Eventos"
                description="Crea ensayos, cultos y sábados. Asigna fechas, horarios y ubicaciones con facilidad."
              />
              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                title="Asignaciones Inteligentes"
                description="Asigna voces principales, coros, músicos y técnicos. Cada persona ve solo lo que le toca."
              />
              <FeatureCard
                icon={<Music className="w-6 h-6" />}
                title="Listas de Alabanzas"
                description="Cada cantante crea su lista con tonalidad y BPM. Envía por WhatsApp con un clic."
              />
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Notificaciones en tiempo real
                </h2>
                <p className="text-muted-foreground mb-6">
                  Recibe alertas instantáneas cuando te asignen a un evento, cuando alguien envíe su lista
                  o recordatorios 24 horas antes de cada actividad.
                </p>
                <ul className="space-y-3">
                  {[
                    'Notificaciones push en la app',
                    'Emails automáticos con Resend',
                    'Recordatorios 24h antes de cada evento',
                    'Confirmación de participación en un clic',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-secondary rounded-xl p-8">
                <div className="space-y-4">
                  <NotificationPreview
                    title="Nueva asignación"
                    message="Te han asignado como Voz Principal para Culto Domingo 23/08"
                    time="Hace 2 min"
                  />
                  <NotificationPreview
                    title="Lista enviada"
                    message="Karla envió su lista para Ensayo Domingo 23/08"
                    time="Hace 15 min"
                  />
                  <NotificationPreview
                    title="Recordatorio"
                    message="Mañana es Ensayo Domingo a las 10:00 AM"
                    time="Mañana 8:00 AM"
                    variant="warning"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">¿Listo para organizar tu ministerio?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Únete a cientos de ministerios que ya usan Alabanza IBG para coordinar sus equipos de alabanza.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                <Users className="w-5 h-5" />
                Crear mi cuenta gratis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/ibglogo.png" alt="IBG Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold">Alabanza IBG</span>
          </div>
          <p className="text-sm">Plataforma de gestión para ministerios de alabanza</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function NotificationPreview({ title, message, time, variant }: { title: string; message: string; time: string; variant?: 'default' | 'warning' }) {
  const bgColor = variant === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
  return (
    <div className={`p-4 rounded-lg border ${bgColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
      </div>
    </div>
  )
}