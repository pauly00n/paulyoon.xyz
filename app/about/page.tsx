import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Mail } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';

export default function About() { 

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl animate-fade-in">
      <section className="space-y-8">
        {/* Hero Section */}
        <div className="flex justify-center">
          <Image 
            src="/about-me-image.png" 
            alt="Paul Yoon" 
            width={500}
            height={500}
            priority
            className="max-w-[500px] w-full"
          />
        </div>
        
        {/* About Section */}
        <Card className="border border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">About Me:</h2>   
            <p className="text-lg text-muted-foreground leading-relaxed">
            I was born in Boston, MA, lived in Houston, TX for 10 years, then moved to the Bay Area for high school.
            I'll be at Stanford for the next ~3 years. I plan to graduate with a degree in Mathematics and a Masters in Computer Science.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
            My passion for building has existed since the first time I touched a Lego piece. I love creating things 
            that I use for myself, such as my LaTeX/Obsidian studying workflow. I find Mathematics a fascinating puzzle, with
            its structures and patterns found in any field I could dream of studying.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
            If I'm not locked in studying or building something, I'm probably either lifting weights, off campus trying 
            a new restaurant, practicing the French Horn, hiking in nature, or watching a good Anime. 
            Feel free to reach out to me anytime about my interests or for anything else! 
            </p>
          </CardContent>
        </Card>

        
      </section>
    </div>
  );
}
