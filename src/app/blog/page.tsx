
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { blogPosts } from '@/lib/blog-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-secondary py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Nuestro Blog Floral</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Consejos, inspiración y todo lo que necesitas saber sobre el maravilloso mundo de las flores.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card 
                key={post.slug} 
                className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <CardHeader className="p-0">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={400}
                      height={250}
                      className="w-full h-auto object-cover aspect-[16/9]"
                    />
                  </CardHeader>
                </Link>
                <CardContent className="p-6 flex-grow">
                  <CardTitle className="text-xl font-bold mb-2">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </CardTitle>
                  <CardDescription>{post.excerpt}</CardDescription>
                </CardContent>
                <CardFooter className="p-6 flex justify-between items-center text-sm text-muted-foreground">
                   <div className='flex items-center gap-2'>
                        <Calendar className="w-4 h-4" />
                        <span>{format(post.date, 'dd MMMM, yyyy', { locale: es })}</span>
                   </div>
                   <Button asChild variant="secondary">
                     <Link href={`/blog/${post.slug}`}>Leer más</Link>
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
