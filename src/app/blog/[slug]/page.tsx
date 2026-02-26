
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getPostBySlug, blogPosts } from '@/lib/blog-data';
import Image from 'next/image';
import { Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Artículo no encontrado',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${post.title} - Blog de Florarte`,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} - Blog de Florarte`,
      description: post.excerpt,
      images: [post.image, ...previousImages],
    },
  };
}


export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-secondary py-12">
        <div className="container mx-auto px-4 md:px-6">

             <Breadcrumb className="mb-8">
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                 <BreadcrumbItem>
                    <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
                 </BreadcrumbItem>
                 <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{post.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>


          <article className="bg-background p-6 md:p-10 rounded-lg shadow-lg max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-4">
                {post.title}
              </h1>
              <div className="flex items-center text-muted-foreground text-sm space-x-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(post.date, 'dd MMMM, yyyy', { locale: es })}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <Badge variant="secondary">{post.category}</Badge>
                </div>
              </div>
            </header>

            <div className="relative w-full h-auto aspect-[16/9] mb-8">
                 <Image
                    src={post.image}
                    alt={post.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                />
            </div>
            
            <div
              className="prose lg:prose-xl max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
