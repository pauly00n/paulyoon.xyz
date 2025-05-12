import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Mail } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';

export default function Home() {

const bulletPoints = [
    "AI Agents for Cryptocurrency Tokenization (Project)",
    "Deep Learning for Computer Vision (Course)",
    "Mathematical Analysis beyond the Real Line (Course)",
    "Applied Matrix Theory - Course",
    // Add more bullet points here easily
  ];
  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl animate-fade-in">
      <section className="space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-sm"></div>
            <Image
              src="/paulyoon.xyz/profile-image.png"
              alt="Paul Yoon"
              width={160}
              height={160}
              priority
              className="h-40 w-40 rounded-full border-4 border-background"
            />
          </div>
          
          <div className="space-y-4 text-center md:text-left mt-8 md:mt-12">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Hi! I'm Paul Yoon.
              </h1>
              <p className="text-xl text-muted-foreground">
                Math Undergraduate at Stanford University
              </p>
            </div>
            
          </div>
        </div>
        
        {/* About Section */}
        <Card className="border border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              I'm an undergraduate at <span className="font-medium text-foreground">Stanford University</span> studying <span className="font-medium text-foreground">Mathematics</span>. 
              I strive to find meaning through my work, whether I'm building projects, conducting research, or learning new things. 
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              I was formerly a data science intern at <a href="https://sundial.so" className="font-medium text-primary underline-offset-4 hover:underline transition-all">Sundial</a>, 
              an analytics platform that transforms raw data into visualizations for businesses, and a research assistant at <span className="font-medium text-foreground">Stanford School of Medicine </span>
              for pain imaging, where I presented my research results at the <a href="https://snmmi.org" className="font-medium text-primary underline-offset-4 hover:underline transition-all">Society 
              of Nuclear Medicine and Molecular Imaging</a>'s annual meeting.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              I love chatting with new people, so feel free to <a href="#contact" className="font-medium text-primary underline-offset-4 hover:underline transition-all">contact me!</a>
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Currently Working On:</h2>   
            {bulletPoints.map((point, index) => (
              <p key={index} className="text-lg text-muted-foreground leading-relaxed">
                • {point}
              </p>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
