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
  const base = `You are a LinkedIn post writing expert. Write for a ${audience} audience.`;

  if (mode === "generate") {
    return `${base} Use the "${fw?.label}" framework (${fw?.desc}). Structure: Hook (1-2 punchy lines) → Story/Body → Lesson/Insight → Call to Action. Use short paragraphs, line breaks for readability. No hashtags. No emojis. Professional but engaging.`;
  }
  if (mode === "hooks") {
    return `${base} Generate exactly 8 different hook options for a LinkedIn post. Each hook should be 1-2 lines max, designed to stop scrolling. Return ONLY the hooks, one per line, separated by "---". No numbering, no explanations.`;
  }
  if (mode === "rewrite") {
    return `${base} Rewrite the following LinkedIn post using the "${fw?.label}" framework (${fw?.desc}). Make it more engaging, better structured, with a strong hook. Keep the core message but transform the writing. No hashtags. No emojis.`;
  }
  if (mode === "carousel") {
    return `${base} Create a LinkedIn carousel with exactly ${slideCount} slides. Return as JSON array: [{"title": "...", "content": "..."}]. First slide is the cover/hook. Last slide is the CTA. Each slide should be concise (max 50 words content). Return ONLY valid JSON, no markdown.`;
  }
  return base;
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

      try {
        let full = "";
        await streamChat({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: params.idea },
          ],
          onDelta: (chunk) => {
            full += chunk;
            if (params.mode === "hooks") {
              setHooks(full.split("---").map((h) => h.trim()).filter(Boolean));
            } else if (params.mode === "carousel") {
              // try to parse as we go
              try {
                const parsed = JSON.parse(full);
                if (Array.isArray(parsed)) setCarouselSlides(parsed);
              } catch { /* incomplete json */ }
            } else {
              setContent(full);
            }
          },
          onDone: () => {
            setLoading(false);
            if (params.mode === "carousel") {
              try {
                // try to extract JSON from the full response
                const match = full.match(/\[[\s\S]*\]/);
                if (match) {
                  const parsed = JSON.parse(match[0]);
                  if (Array.isArray(parsed)) setCarouselSlides(parsed);
                }
              } catch {
                toast({ title: "Failed to parse carousel", variant: "destructive" });
              }
            }
            if (params.mode === "hooks") {
              setHooks(full.split("---").map((h) => h.trim()).filter(Boolean));
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
          onRewrite={() => {}}
          onGenerateCarousel={() => {}}
          onSelectHook={handleSelectHook}
          hoveredHook={hoveredHook}
          onHoverHook={setHoveredHook}
        />
      </div>
    </div>
  );
}
