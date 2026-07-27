import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TextLink({href, children, className }: {href: string; children:React.ReactNode; className?: string }) {
    return (
    <Link href={href} className={cn("group text-base font-medium text-foreground relative inline-block", className)}>
      {children}
      <span className="absolute left-0 bottom-0 w-full h-px bg-foreground opacity-0 translate-y-[1px] transition-[opacity,translate] duration-200 group-hover:duration-[120ms] group-hover:opacity-100 group-hover:translate-y-0" />
    </Link>
  );
}
