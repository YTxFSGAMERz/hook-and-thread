import { motion, AnimatePresence } from "framer-motion";
import { Copy, Save, RefreshCw, Layers, ChevronLeft, ChevronRight, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CarouselSlide {
  title: string;
  content: string;
}

interface ViralAngle {
  type: string;
  title: string;
  preview: string;
  hook: string;
}

interface Props {
  content: string;
  originalContent?: string;
  hooks?: string[];
  carouselSlides?: CarouselSlide[];
  viralAngles?: ViralAngle[];
  mode: string;
  loading: boolean;
  onSave: () => void;
  onRewrite: () => void;
  onGenerateCarousel: () => void;
  onHooksToggle: () => void;
  onSelectHook?: (hook: string) => void;
  onSelectAngle?: (angle: ViralAngle) => void;
  hoveredHook?: string | null;
  onHoverHook?: (hook: string | null) => void;
}

export default function StagePane({
  content,
  originalContent,
  hooks,
  carouselSlides,
  viralAngles,
  mode,
  loading,
  onSave,
  onRewrite,
  onGenerateCarousel,
  onHooksToggle,
  onSelectHook,
  onSelectAngle,
  hoveredHook,
  onHoverHook,
}: Props) {
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleCopy = () => {
    const text = hoveredHook || content;
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const lines = (hoveredHook || content).split("\n");
  const hookLines = lines.slice(0, 2);
  const hookTooLong = hookLines.join(" ").length > 100;

  const displayContent = hoveredHook || content;

  return (
    <div className="w-[550px] shrink-0 flex flex-col h-full bg-background/80 backdrop-blur-sm">
      {/* Rhythm Ruler */}
      {mode !== "carousel" && displayContent && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          <div className="flex gap-1">
            <div className={cn("h-1.5 w-8 rounded-full", hookTooLong ? "bg-destructive" : "bg-primary")} />
            <div className="h-1.5 w-16 rounded-full bg-muted" />
            <div className="h-1.5 w-6 rounded-full bg-muted" />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {hookTooLong ? "Hook too long" : "Hook · Fold · CTA"}
          </span>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Hooks mode */}
        {mode === "hooks" && hooks && hooks.length > 0 && (
          <div className="space-y-2">
            {hooks.map((hook, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onMouseEnter={() => onHoverHook?.(hook)}
                onMouseLeave={() => onHoverHook?.(null)}
                onClick={() => onSelectHook?.(hook)}
                className={cn(
                  "w-full text-left p-3 border rounded-lg text-sm transition-all duration-200",
                  hoveredHook === hook
                    ? "border-primary bg-primary/5 shadow-[0_0_20px_hsl(160_100%_50%/0.15)]"
                    : "border-border bg-card hover:border-muted-foreground hover:shadow-lg"
                )}
              >
                {hook}
              </motion.button>
            ))}
          </div>
        )}

        {/* Viral Angles mode */}
        {mode === "viral" && viralAngles && viralAngles.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Click an angle to generate a full post from it</p>
            {viralAngles.map((angle, i) => {
              const icons: Record<string, string> = {
                controversial: "🔥",
                failure: "💥",
                insight: "📊",
                framework: "🛠️",
                mythbust: "🚨",
              };
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => onSelectAngle?.(angle)}
                  className="glow-card w-full text-left p-4 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{icons[angle.type] || "⚡"}</span>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {angle.title}
                    </span>
                  </div>
                  <p className="text-xs text-primary/80 font-medium mb-1 italic">
                    "{angle.hook}"
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {angle.preview}
                  </p>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Carousel mode */}
        {mode === "carousel" && carouselSlides && carouselSlides.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                Slide {currentSlide + 1} of {carouselSlides.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSlide(Math.min(carouselSlides.length - 1, currentSlide + 1))}
                  disabled={currentSlide === carouselSlides.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="aspect-square border border-border rounded-lg bg-card p-8 flex flex-col justify-center"
              >
                <h3 className="text-xl font-bold mb-4">{carouselSlides[currentSlide].title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {carouselSlides[currentSlide].content}
                </p>
              </motion.div>
            </AnimatePresence>
            {/* Filmstrip */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {carouselSlides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "shrink-0 w-16 h-16 rounded border text-[8px] p-1.5 leading-tight overflow-hidden transition-colors",
                    currentSlide === i
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  {slide.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rewrite mode: side by side */}
        {mode === "rewrite" && originalContent && content && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground font-medium mb-1.5 block">ORIGINAL</span>
              <div className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-3 whitespace-pre-wrap">
                {originalContent}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-primary font-medium mb-1.5 block">REWRITTEN</span>
              <div className="text-sm bg-card border border-primary/30 rounded-lg p-3 whitespace-pre-wrap">
                {content}
              </div>
            </div>
          </div>
        )}

        {/* Default post preview */}
        {(mode === "generate" || (mode === "rewrite" && !originalContent) || mode === "hooks") && displayContent && mode !== "hooks" && (
          <div className="elevated-card p-5">
            {/* LinkedIn-style header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div>
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-2 w-32 bg-muted rounded mt-1.5" />
              </div>
            </div>
            {/* Post content */}
            <div className="space-y-0">
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-sm leading-relaxed"
                >
                  {line || <br />}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!displayContent && !hooks?.length && !carouselSlides?.length && !loading && (
          <div className="flex-1 flex items-center justify-center h-full fade-in">
            <div className="gradient-border p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Your generated post will appear here.
                <br />
                <span className="text-xs">Start by writing an idea in The Forge.</span>
              </p>
            </div>
          </div>
        )}

        {loading && !displayContent && (
          <div className="flex items-center justify-center h-32">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin pulse-glow" />
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-border p-3 flex items-center gap-2 bg-card/50 backdrop-blur-sm">
        <Button onClick={handleCopy} disabled={!displayContent} className="mechanical-press flex-1">
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Copy
        </Button>
        <Button onClick={onSave} variant="secondary" disabled={!content} className="mechanical-press">
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save
        </Button>
        <Button onClick={onRewrite} variant="secondary" disabled={!content} className="mechanical-press">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button onClick={onGenerateCarousel} variant="secondary" disabled={!content} className="mechanical-press">
          <Layers className="h-3.5 w-3.5" />
        </Button>
        <Button onClick={onHooksToggle} variant="secondary" disabled={!hooks || hooks.length === 0} className="mechanical-press">
          <List className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
