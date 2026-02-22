// src/components/Testimonials.tsx
'use client';

import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import type { Testimonial } from "@/lib/definitions";

interface TestimonialsProps {
  testimonials: Testimonial[];
  isLoading?: boolean;
}

const TestimonialSkeleton = () => (
    <Card className="border-border/50 shadow-sm bg-card">
        <CardContent className="p-8 flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-full mb-4" />
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-5 w-1/3 mt-4" />
        </CardContent>
    </Card>
)

export function Testimonials({ testimonials, isLoading }: TestimonialsProps) {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  if (!isLoading && testimonials.length === 0) {
    return null; // Don't render the section if there are no approved testimonials
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold font-headline text-foreground mb-2">Lo que dicen nuestros clientes</h2>
        <p className="text-lg text-muted-foreground mb-12">Tu confianza es nuestra mayor recompensa.</p>
        <Carousel
          plugins={[autoplayPlugin.current]}
          className="w-full"
        >
          <CarouselContent>
            {isLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                 <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full flex">
                      <TestimonialSkeleton />
                    </div>
                 </CarouselItem>
               ))
            ) : (
                testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full flex">
                    <Card className="border-border/50 shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card h-full w-full">
                        <CardContent className="p-8 flex flex-col items-center justify-center h-full">
                        <Avatar className="h-16 w-16 mb-4">
                            <AvatarImage src={testimonial.userProfilePic || undefined} alt={`Foto de perfil de ${testimonial.userName}`} />
                            <AvatarFallback>{testimonial.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center mb-4">
                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                            ))}
                        </div>
                        <p className="text-muted-foreground italic text-center mb-4 flex-grow">"{testimonial.comment}"</p>
                        <p className="font-bold text-foreground mt-auto">{testimonial.userName}</p>
                        </CardContent>
                    </Card>
                    </div>
                </CarouselItem>
                ))
            )}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
