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

  if (mode === "viral") {
    return `You are a top LinkedIn ghostwriter and viral content strategist.

Given a topic, generate 5 unique "viral angles" — each a different creative lens to write a high-engagement LinkedIn post from.

The 5 angles MUST be:
1. Controversial Opinion — a bold, slightly polarizing take
2. Personal Failure Story — a relatable "I messed up" narrative
3. Industry Insight — a data-driven or insider perspective
4. Step-by-Step Framework — a structured how-to breakdown
5. Myth-Busting Post — debunking a common misconception

For each angle, provide:
- "type": the angle type (e.g. "controversial", "failure", "insight", "framework", "mythbust")
- "title": a catchy 5-8 word title for this angle
- "preview": a 1-2 sentence preview of what the post would say
- "hook": one punchy hook line (under 12 words) for this angle

Context:
- Audience: "${audience}"
- Tone: Professional but slightly opinionated

OUTPUT FORMAT (strict JSON, no markdown outside):
{
  "angles": [
    { "type": "controversial", "title": "...", "preview": "...", "hook": "..." },
    { "type": "failure", "title": "...", "preview": "...", "hook": "..." },
    { "type": "insight", "title": "...", "preview": "...", "hook": "..." },
    { "type": "framework", "title": "...", "preview": "...", "hook": "..." },
    { "type": "mythbust", "title": "...", "preview": "...", "hook": "..." }
  ]
}

IMPORTANT:
- Output ONLY a single valid JSON object.
- Do NOT wrap it in markdown code fences.
- Do NOT include any text before or after the JSON.`;
  }

  const frameworkInstructions: Record<string, string> = {
    contrast: "Open with the END RESULT first — the impressive 'after'. Then hit them with the ugly, embarrassing 'before'. The gap between them IS the post.",
    mistake: "Start mid-action. Not 'I once made a mistake.' Instead: 'I was 2 hours into a demo with our biggest client when I noticed the database was empty.' Drop us into the moment.",
    "deep-dive": "Open with one counterintuitive fact that makes the reader stop scrolling. Not a question. A statement that feels wrong but is true.",
    list: "No 'Here are 7 things' opener. Jump straight into item #1 like a punch. The reader figures out it's a list by slide 2.",
    "hot-take": "Lead with the spiciest version of your claim. No softening. No 'unpopular opinion but...' Just the take. Then back it up with receipts.",
    story: "One specific moment. Not a summary of your career. One room, one conversation, one realization. Make the reader smell the coffee.",
  };

  const fwInstruction = frameworkInstructions[framework] || "";

  return `You are a sharp, opinionated LinkedIn ghostwriter who sounds like a REAL PERSON — not a content mill.

VOICE RULES (non-negotiable):
- Write like you're texting a smart friend over coffee
- Use contractions always (you're, don't, can't, it's)
- Start sentences with "And", "But", "So", "Look," when it feels natural
- Incomplete sentences are fine. Fragments work. Like this.
- Lowercase is fine where it feels natural
- ONE emoji max per post. Zero is better. Never 🚀

BANNED PHRASES (instant fail if used):
- "In today's fast-paced world"
- "Here's the thing"
- "Let me be honest"
- "Game-changer" / "game changer"
- "Dive deep" / "deep dive"
- "At the end of the day"
- "It's not about X, it's about Y"
- "Hot take:" as an opener
- "Unpopular opinion:"
- "I'm going to say something controversial"
- "This changed everything"
- "Most people don't realize"
- Any sentence starting with "Imagine"
- "Are you ready?"
- "Here's why"
- "Let that sink in"

HOOK RULES:
- Max 8 words
- No questions as hooks
- Don't start with "I"
- Pattern interrupt only — say something unexpected
- Examples of good hooks: "We fired our best engineer." / "Nobody reads your LinkedIn posts." / "I mass-deleted 200 blog posts."

FORMATTING:
- No line longer than 12 words
- No paragraph longer than 2 lines
- Every line break is intentional white space
- The post should feel like scrolling through punchy thoughts
- NOT like reading an essay or a blog post
- Max 1200 characters total

FRAMEWORK: "${fw?.label}" — ${fw?.desc}
${fwInstruction}

AUDIENCE: ${audience}

CTA RULES:
- End with a specific, low-effort question
- NOT "What do you think?" or "Agree?"
- Instead something like: "What's the worst deploy you've survived?" or "Name one tool you'd mass-delete from your stack."

Generate ALL of the following in a SINGLE, VALID JSON object:

1. Main post following the rules above
2. 3 alternative hooks (all under 8 words, all different angles)
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
  const [viralAngles, setViralAngles] = useState<{ type: string; title: string; preview: string; hook: string }[]>([]);
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
      setViralAngles([]);
      setCurrentMode(params.mode);
      if (params.mode === "rewrite") setOriginalContent(params.idea);
      else setOriginalContent("");

      const systemPrompt = buildSystemPrompt(params.mode, params.framework, params.audience, params.slideCount);
      const userMessage = params.mode === 'rewrite'
        ? `Rewrite this exact post:\n\n${params.idea}`
        : params.mode === 'viral'
          ? `Topic: ${params.idea}`
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
                if (params.mode === "viral" && Array.isArray(parsed.angles)) {
                  setViralAngles(parsed.angles);
                } else {
                  setContent(parsed.post_markdown || "");
                  if (Array.isArray(parsed.hooks)) setHooks(parsed.hooks);
                  if (Array.isArray(parsed.carousel)) setCarouselSlides(parsed.carousel);
                }
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

  const handleSelectAngle = useCallback(
    (angle: { type: string; title: string; preview: string; hook: string }) => {
      const angleIdea = `Write a LinkedIn post using this viral angle:\n\nAngle: ${angle.title}\nType: ${angle.type}\nHook: ${angle.hook}\nDirection: ${angle.preview}`;
      setViralAngles([]);
      handleGenerate({ mode: "generate", idea: angleIdea, framework: "hot-take" as Framework, audience: "developers" as Audience });
    },
    [handleGenerate]
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-11 border-b border-border/50 flex items-center justify-between px-4 shrink-0 bg-card/30 backdrop-blur-md shadow-[0_1px_8px_hsl(0_0%_0%/0.3)]">
        <span className="font-semibold text-sm tracking-tight">
          Hook<span className="text-gradient">&</span>Thread
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
          viralAngles={viralAngles}
          mode={currentMode}
          loading={loading}
          onSave={handleSave}
          onRewrite={() => setCurrentMode(currentMode !== "rewrite" ? "rewrite" : "generate")}
          onGenerateCarousel={() => setCurrentMode(currentMode !== "carousel" ? "carousel" : "generate")}
          onHooksToggle={() => setCurrentMode(currentMode !== "hooks" ? "hooks" : "generate")}
          onSelectHook={handleSelectHook}
          onSelectAngle={handleSelectAngle}
          hoveredHook={hoveredHook}
          onHoverHook={setHoveredHook}
        />
      </div>
    </div>
  );
}
