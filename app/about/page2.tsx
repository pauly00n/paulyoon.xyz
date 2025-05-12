import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Mail } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl animate-fade-in">
      <section className="space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-sm"></div>
            <Avatar className="h-40 w-40 border-4 border-background">
              <AvatarImage src="/profile-image.png" alt="Paul Yoon" />
              <AvatarFallback>PY</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="space-y-4 text-center md:text-left mt-8 md:mt-12">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Hi! I'm Paul Yoon.
              </h1>
              <p className="text-xl text-muted-foreground">
                Math undergraduate at Stanford University
              </p>
            </div>
            
            
            
          </div>
        </div>
        
        {/* About Section */}
        <Card className="border border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">

            <p className="text-lg text-muted-foreground leading-relaxed">
            I was born in Boston, MA, lived in Houston, TX for 10 years, then moved to Menlo Park, CA for high school.
            I'll be at Stanford for the next 3-4 years. I plan to graduate with a degree in Mathematics and a Masters in Computer Science.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
            My passion for building has existed since the first time I touched a Lego piece. I love creating things 
            that I use for myself. I only recently
            learned how to code, so I'm spending my time honing my skills and learning anything that seems interesting.
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
