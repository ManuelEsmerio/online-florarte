
import Link from 'next/link'
import Header from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Flower2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <div className="flex flex-col items-center text-center">
            <Flower2 className="h-24 w-24 text-primary/50" />
            <h1 className="mt-8 text-6xl font-bold font-headline tracking-tight text-foreground">
              404
            </h1>
            <p className="mt-4 text-2xl font-semibold text-foreground">
              Página no encontrada
            </p>
            <p className="mt-2 text-lg text-muted-foreground">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>
            <Button asChild className="mt-8" size="lg">
              <Link href="/">Regresar a la Tienda</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
