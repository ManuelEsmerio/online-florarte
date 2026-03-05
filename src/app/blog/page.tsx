
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { blogPosts } from '@/lib/blog-data';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-background py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Nuestro Blog Floral</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Consejos, inspiración y todo lo que necesitas saber sobre el maravilloso mundo de las flores.
            </p>
          </div>

          {blogPosts.length === 0 ? (
            <div className="text-center py-24 animate-fade-in">
              <div className="inline-flex p-6 bg-secondary/50 rounded-full mb-6">
                <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-3">Próximamente</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-10">
                Estamos preparando contenido para ti. ¡Vuelve pronto!
              </p>
              <Button asChild size="lg" className="h-14 px-10 rounded-2xl font-bold shadow-lg shadow-primary/20">
                <Link href="/products/all">Explorar Tienda</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <Card
                  key={post.slug}
                  className="flex flex-col overflow-hidden rounded-[2rem] border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <Link href={`/blog/${post.slug}`} className="block overflow-hidden rounded-t-[2rem]">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={400}
                      height={250}
                      className="w-full h-auto object-cover aspect-[16/9] transition-transform duration-500 hover:scale-105"
                    />
                  </Link>
                  <CardContent className="p-6 flex-grow">
                    <h2 className="text-xl font-bold font-headline mb-2 leading-snug">
                      <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">{format(post.date, 'dd MMMM, yyyy', { locale: es })}</span>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-primary hover:bg-primary/5 hover:text-primary">
                      <Link href={`/blog/${post.slug}`}>Leer más</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
