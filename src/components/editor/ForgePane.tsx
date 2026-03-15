import { useState } from "react";
import { Zap, PenTool, RefreshCw, Layers, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FRAMEWORKS, AUDIENCES, type Framework, type Audience, type EditorMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MODES: { id: EditorMode; label: string; icon: typeof Zap }[] = [
  { id: "generate", label: "Generate", icon: Zap },
  { id: "hooks", label: "Hooks", icon: PenTool },
  { id: "rewrite", label: "Rewrite", icon: RefreshCw },
  { id: "carousel", label: "Carousel", icon: Layers },
  { id: "viral", label: "Viral Angles", icon: Target },
];

interface Props {
  onGenerate: (params: {
    mode: EditorMode;
    idea: string;
    framework: Framework;
    audience: Audience;
    slideCount?: number;
  }) => void;
  loading: boolean;
}

export default function ForgePane({ onGenerate, loading }: Props) {
  const [mode, setMode] = useState<EditorMode>("generate");
  const [idea, setIdea] = useState("");
  const [framework, setFramework] = useState<Framework>("contrast");
  const [audience, setAudience] = useState<Audience>("developers");
  const [slideCount, setSlideCount] = useState(5);

  const handleSubmit = () => {
    if (!idea.trim()) return;
    onGenerate({ mode, idea: idea.trim(), framework, audience, slideCount });
  };

  const placeholder: Record<EditorMode, string> = {
    generate: "Enter your raw idea or topic...\n\ne.g. 'I learned SQL optimization today'",
    hooks: "Enter a topic to generate hooks for...\n\ne.g. 'AI replacing developer tasks'",
    rewrite: "Paste your existing post here...\n\nThe AI will transform it into engaging content.",
    carousel: "Enter a topic for your carousel...\n\ne.g. '5 SQL mistakes developers make'",
    viral: "Enter a topic to generate viral angles...\n\ne.g. 'AI agents'",
  };

  return (
    <div className="flex-1 flex flex-col h-full border-r border-border min-w-[300px] bg-background/80 backdrop-blur-sm">
      {/* Mode tabs */}
      <div className="flex border-b border-border bg-card/30 backdrop-blur-sm">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2",
              mode === m.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Idea input */}
        <Textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder={placeholder[mode]}
          className="flex-1 min-h-[160px] font-mono text-sm bg-card/50 resize-none border-border/50 focus:border-primary/50 focus:shadow-[0_0_20px_hsl(160_100%_50%/0.1)] transition-shadow duration-300"
        />

        {/* Framework selector */}
        {(mode === "generate" || mode === "rewrite") && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Framework</label>
            <div className="grid grid-cols-2 gap-1.5">
              {FRAMEWORKS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFramework(f.id)}
                  className={cn(
                    "text-left px-3 py-2 rounded-lg border text-xs transition-all duration-200",
                    framework === f.id
                      ? "border-primary bg-primary/10 text-foreground shadow-[0_0_15px_hsl(160_100%_50%/0.1)]"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground hover:shadow-md"
                  )}
                >
                  <span className="font-medium block">{f.label}</span>
                  <span className="text-[10px] opacity-70">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audience selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Audience</label>
          <div className="flex flex-wrap gap-1.5">
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200",
                  audience === a.id
                    ? "border-primary bg-primary/10 text-foreground shadow-[0_0_12px_hsl(160_100%_50%/0.1)]"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Slide count for carousel */}
        {mode === "carousel" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Slides: {slideCount}
            </label>
            <input
              type="range"
              min={3}
              max={10}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !idea.trim()}
          className="w-full mechanical-press shadow-lg hover:shadow-[0_0_25px_hsl(160_100%_50%/0.2)] transition-shadow duration-300"
          size="lg"
        >
          {loading ? "Generating..." : mode === "viral" ? "Generate Angles" : mode === "hooks" ? "Generate Hooks" : mode === "carousel" ? "Build Carousel" : mode === "rewrite" ? "Rewrite Post" : "Generate Post"}
        </Button>
      </div>
    </div>
  );
}
