import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, PenTool, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Zap, title: "Post Generator", desc: "Raw idea → structured viral post in seconds" },
  { icon: PenTool, title: "Hook Generator", desc: "6-8 scroll-stopping hooks per topic" },
  { icon: RefreshCw, title: "Post Rewriter", desc: "Transform boring posts into engaging content" },
  { icon: Layers, title: "Carousel Builder", desc: "Multi-slide carousels ready for PDF export" },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-foreground tracking-tight">
          Hook<span className="text-primary">&</span>Thread
        </span>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="mechanical-press text-muted-foreground">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="mechanical-press">
              Get started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            High-signal posts for
            <br />
            <span className="text-primary">low-noise creators.</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Transform raw ideas into structured LinkedIn posts that stop the scroll. Powered by AI.
          </p>
          <Link to="/signup">
            <Button size="lg" className="mechanical-press px-8 text-base">
              Start writing →
            </Button>
          </Link>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-4xl w-full"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="border border-border rounded-lg p-5 bg-card"
            >
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-medium text-sm mb-1">{f.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 text-center text-muted-foreground text-xs">
        Hook & Thread — AI LinkedIn Post Generator
      </footer>
    </div>
  );
}
