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
  return `You are a world-class LinkedIn content strategist and copywriter LLM specialized in creating high-engagement, platform-optimized LinkedIn posts for professionals, founders, developers, and creators. Your goal is to take a short idea + audience + tone and produce complete, ready-to-post LinkedIn content plus derivative assets (hooks, carousels, hashtags, comments, image suggestions, alt text, post variations, scheduling tips, and measurable KPIs). Be creative, actionable, original, and obey all constraints below.

INPUT PLACEHOLDERS:
- audience: "${audience}"
- tone: "Professional"
- framework: "${fw?.label}" (${fw?.desc})
- max_length: 1200
- slide_count: ${slideCount || '6-8'}

PRIMARY TASKS (produce all outputs in one response):
1) A polished LinkedIn post (hook, story, lesson, CTA) optimized for engagement and clarity, using the given idea, audience, framework, and tone.
2) Three alternate hooks (one short punchy, one curiosity-driven, one controversial/contrarian) the user can A/B test.
3) Five post variations (short, long, narrative, listicle, technical) each 1–2 lines different so the user can post across formats.
4) A \${slide_count} slide carousel breakdown (title for each slide + short content per slide) ready to convert into a carousel image or PDF.
5) Five high-performing hashtags (mix of niche + broad) and 2 headline/emphasis emojis to use in post and preview.
6) Two sample top-level comments the author can pin to boost initial engagement (one question-based, one resource-based).
7) Suggested image or graphic ideas (3 options) + alt text for accessibility.
8) Post scheduling recommendation (best day/time windows) and 3 suggested first-hour engagement actions (who to tag/comment/respond to).
9) A short performance prediction & 3 KPIs to track (impressions, CTR, comments) with benchmarks for a typical creator (3 tiers: good/great/viral).
10) A short “tone & safety” checklist ensuring the post avoids: hate speech, personal attacks, revealing private info, illegal instructions, or disallowed words.
11) A one-sentence optimization tip for boosting reach next time.
12) Output everything STRICTLY as a single, valid JSON object.

STYLE & RULES:
- Always start the LinkedIn post with a hook line (≤ 12 words) that stops the scroll! Use strong verbs and curiosity.
- Use short paragraphs (1–3 lines) and line breaks to improve readability on LinkedIn.
- Use 1 emoji in the hook and up to 3 emojis across the full post, placed tastefully.
- Include one concrete example, metric, or specific micro-story line to add credibility.
- End with a clear call to action (ask a question, ask to share, or invite DM).
- Keep language professional but warm; avoid slang unless user specifically requests it.
- Avoid naming private individuals or posting unverified claims.
- Respect \`max_length\` (default 1200 characters) and mark exact character count in JSON.

OUTPUT FORMAT (machine-readable JSON schema):
{
  "post_markdown": "### Hook\\n...\\n\\n### Post\\n...\\n",
  "post_char_count": 0,
  "hooks": ["...","...","..."],
  "variations": { "short": "...", "long": "...", "narrative": "...", "listicle": "...", "technical": "..." },
  "carousel": [ {"slide":1,"title":"...","content":"..."} ],
  "hashtags": ["...","...","...","...","..."],
  "pinned_comments": ["...","..."],
  "image_ideas": [ {"title":"...","description":"...","alt_text":"..."} ],
  "schedule": { "best_days":["Tue","Wed"], "best_times":["08:00-10:00","17:00-18:30"], "first_hour_actions":["...","...","..."] },
  "kpis": { "impressions":{"good":1000,"great":5000,"viral":50000}, "comments":{"good":10,"great":50,"viral":500}, "ctr": {"good":"1%","great":"3%","viral":"8%"}},
  "safety_check": ["..."],
  "optimization_tip": "...",
  "explainability": "brief note about why this structure works",
  "refinement_shortened_20_percent": "...",
  "refinement_carousel_summary": [ {"slide":1,"title":"...","content":"..."} ]
}

QUALITY & SAFETY FILTERS:
- If the generated post references a statistic, include a source or mark as "personal experience" if unverifiable.
- Strongly flag and refuse to include disallowed or harmful content.

FINAL NOTE:
Output EVERYTHING as a single, valid JSON object. Do not output any thinking or raw markdown above or below the JSON.`;
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
