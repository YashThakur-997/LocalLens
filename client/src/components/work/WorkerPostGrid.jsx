import { AspectRatio } from "@/components/ui/aspect-ratio"

function WorkerPostCard({ post, onClick }) {
  return (
    <AspectRatio ratio={1}>
      <button type="button" onClick={onClick} className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 focus:outline-none">
        {post.mediaType === "video" ? (
          <video src={post.mediaUrl} controls={false} playsInline muted className="h-full w-full object-cover" />
        ) : (
          <img src={post.mediaUrl} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-3">
          <p className="text-[11px] uppercase tracking-wide text-white/70">{post.category}</p>
          <p className="text-sm font-medium text-white">{post.title}</p>
        </div>
      </button>
    </AspectRatio>
  )
}

export default function WorkerPostGrid({ posts, emptyMessage = "No uploads yet.", onOpenPost }) {
  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
      {posts.map((post, idx) => (
        <WorkerPostCard key={post.id} post={post} onClick={() => onOpenPost?.(idx)} />
      ))}
    </div>
  )
}