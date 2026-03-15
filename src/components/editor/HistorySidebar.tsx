import { useState, useEffect } from "react";
import { Search, FileText, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  title: string | null;
  content: string;
  mode: string;
  created_at: string;
}

interface Props {
  onSelect: (post: Post) => void;
  selectedId?: string;
  refreshKey: number;
}

export default function HistorySidebar({ onSelect, selectedId, refreshKey }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("posts")
      .select("id, title, content, mode, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPosts(data);
      });
  }, [user, refreshKey]);

  const filtered = posts.filter(
    (p) =>
      (p.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from("posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const getPreview = (content: string) => {
    const first = content.split("\n").find((l) => l.trim());
    return first ? (first.length > 40 ? first.slice(0, 40) + "…" : first) : "Untitled";
  };

  return (
    <div className="w-60 border-r border-border bg-sidebar flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs bg-sidebar-accent"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-xs p-4 text-center">No saved posts yet</p>
        )}
        {filtered.map((post) => (
          <button
            key={post.id}
            onClick={() => onSelect(post)}
            className={cn(
              "w-full text-left px-3 py-2.5 border-b border-border hover:bg-sidebar-accent transition-colors group",
              selectedId === post.id && "bg-sidebar-accent"
            )}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium truncate">
                  {post.title || getPreview(post.content)}
                </span>
              </div>
              <Trash2
                className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0 mt-0.5"
                onClick={(e) => handleDelete(e, post.id)}
              />
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
