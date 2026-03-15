import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { streamChat } from "@/lib/stream";
import { type EditorMode, type Framework, type Audience, FRAMEWORKS } from "@/lib/constants";
import HistorySidebar from "@/components/editor/HistorySidebar";
import ForgePane from "@/components/editor/ForgePane";
import StagePane from "@/components/editor/StagePane";

function buildSystemPrompt(mode: EditorMode, framework: Framework, audience: Audience, slideCount?: number) {
  const fw = FRAMEWORKS.find((f) => f.id === framework);
  return `You are a top LinkedIn ghostwriter.

Write a high-engagement LinkedIn post using this structure:

1. A controversial or curiosity-driven hook (under 12 words).
2. A short personal or realistic story.
3. A clear insight or lesson learned.
4. 3 actionable takeaways.
5. A question that encourages comments.

Formatting rules:
- Use short 1-2 line paragraphs
- Make it easy to skim on mobile
- Avoid generic advice
- Use one surprising idea
- Keep tone human and slightly opinionated

Context:
- Audience: "${audience}"
- Tone: "Professional"
- Framework: "${fw?.label}" (${fw?.desc})
- Max post length: 1200 characters
- Carousel slides: ${slideCount || '6-8'}

Generate ALL of the following in a SINGLE, VALID JSON object:

1. Main post (hook + story + lesson + takeaways + closing question)
2. 3 alternative hooks (one punchy, one curiosity-driven, one contrarian)
3. 1 carousel version (${slideCount || '6-8'} slides with title + content each)
4. 5 hashtags (mix of niche + broad)

OUTPUT FORMAT (strict JSON, no markdown outside):
{
  "post_markdown": "The full LinkedIn post text with line breaks as \\n",
  "post_char_count": 0,
  "hooks": ["hook1", "hook2", "hook3"],
  "carousel": [{"slide": 1, "title": "...", "content": "..."}],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}

IMPORTANT:
- Output ONLY a single valid JSON object.
- Do NOT wrap it in markdown code fences.
- Do NOT include any text before or after the JSON.`;
}

export default function Editor() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<{ title: string; content: string }[]>([]);
  const [currentMode, setCurrentMode] = useState<EditorMode>("generate");
  const [loading, setLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [hoveredHook, setHoveredHook] = useState<string | null>(null);

  const handleGenerate = useCallback(
    async (params: { mode: EditorMode; idea: string; framework: Framework; audience: Audience; slideCount?: number }) => {
      setLoading(true);
      setContent("");
      setHooks([]);
      setCarouselSlides([]);
      setCurrentMode(params.mode);
      if (params.mode === "rewrite") setOriginalContent(params.idea);
      else setOriginalContent("");

      const systemPrompt = buildSystemPrompt(params.mode, params.framework, params.audience, params.slideCount);
      const userMessage = params.mode === 'rewrite'
        ? `Rewrite this exact post:\n\n${params.idea}`
        : `Idea: ${params.idea}`;

      try {
        let full = "";
        await streamChat({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          onDelta: (chunk) => {
            full += chunk;
          },
          onDone: () => {
            setLoading(false);
            try {
              const match = full.match(/\{[\s\S]*\}/);
              if (match) {
                const parsed = JSON.parse(match[0]);
                setContent(parsed.post_markdown || "");
                if (Array.isArray(parsed.hooks)) setHooks(parsed.hooks);
                if (Array.isArray(parsed.carousel)) setCarouselSlides(parsed.carousel);
              } else {
                setContent(full);
              }
            } catch {
              setContent(full);
              toast({ title: "Failed to parse final format", variant: "destructive" });
            }
          },
        });
      } catch (err: any) {
        setLoading(false);
        toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      }
    },
    [toast]
  );

  const handleSave = async () => {
    if (!user || !content) return;
    const title = content.split("\n").find((l) => l.trim())?.slice(0, 80) || "Untitled";
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      title,
      content,
      mode: currentMode,
      original_content: originalContent || null,
      carousel_slides: carouselSlides.length > 0 ? JSON.stringify(carouselSlides) : null,
    });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post saved" });
      setRefreshKey((k) => k + 1);
    }
  };

  const handleLoadPost = (post: { id: string; content: string; mode: string; }) => {
    setSelectedPostId(post.id);
    setContent(post.content);
    setCurrentMode(post.mode as EditorMode);
    setHooks([]);
    setCarouselSlides([]);
    setOriginalContent("");
  };

  const handleSelectHook = (hook: string) => {
    setContent(hook);
    setHoveredHook(null);
    toast({ title: "Hook selected — now generate a full post from it" });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-11 border-b border-border flex items-center justify-between px-4 shrink-0">
        <span className="font-semibold text-sm tracking-tight">
          Hook<span className="text-primary">&</span>Thread
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-7 w-7 p-0">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        <HistorySidebar onSelect={handleLoadPost} selectedId={selectedPostId} refreshKey={refreshKey} />
        <ForgePane onGenerate={handleGenerate} loading={loading} />
        <StagePane
          content={content}
          originalContent={originalContent}
          hooks={hooks}
          carouselSlides={carouselSlides}
          mode={currentMode}
          loading={loading}
          onSave={handleSave}
          onRewrite={() => setCurrentMode(currentMode !== "rewrite" ? "rewrite" : "generate")}
          onGenerateCarousel={() => setCurrentMode(currentMode !== "carousel" ? "carousel" : "generate")}
          onHooksToggle={() => setCurrentMode(currentMode !== "hooks" ? "hooks" : "generate")}
          onSelectHook={handleSelectHook}
          hoveredHook={hoveredHook}
          onHoverHook={setHoveredHook}
        />
      </div>
    </div>
  );
}
