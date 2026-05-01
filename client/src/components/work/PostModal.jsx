import { useEffect, useRef, useState } from "react"
import { X, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PostModal({ posts, index: startIndex = 0, onClose }) {
  const scrollerRef = useRef(null)
  const [current, setCurrent] = useState(startIndex)
  const [likes, setLikes] = useState(() => posts.map(() => 0))
  const [liked, setLiked] = useState(() => posts.map(() => false))

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  useEffect(() => {
    // scroll to start index after mount
    const el = scrollerRef.current
    if (!el) return
    const scrollToStart = () => {
      const height = el.clientHeight
      el.scrollTo({ top: startIndex * height, behavior: "instant" })
      setCurrent(startIndex)
    }
    // wait for layout
    requestAnimationFrame(scrollToStart)
  }, [startIndex])

  const onScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    if (idx !== current) setCurrent(idx)
  }

  const toggleLike = (idx) => {
    setLiked((s) => {
      const copy = [...s]
      copy[idx] = !copy[idx]
      return copy
    })
    setLikes((s) => {
      const copy = [...s]
      copy[idx] = copy[idx] + (liked[idx] ? -1 : 1)
      return copy
    })
  }


  useEffect(() => {
    // keep likes arrays in sync when posts change
    setLikes((s) => {
      const copy = posts.map((_, i) => s[i] ?? 0)
      return copy
    })
    setLiked((s) => posts.map((_, i) => s[i] ?? false))
  }, [posts])

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute left-3 top-3 z-30">
        <Button variant="ghost" className="p-2" onClick={onClose}>
          <X />
        </Button>
      </div>

      <div ref={scrollerRef} onScroll={onScroll} className="h-full w-full overflow-y-auto snap-y snap-mandatory">
        {posts.map((post, idx) => (
          <section key={post.id || idx} className="snap-start h-screen flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-black">
              {post.mediaType === "video" ? (
                <video src={post.mediaUrl} controls className="max-h-[85vh] w-auto max-w-full object-contain" />
              ) : (
                <img src={post.mediaUrl} alt={post.title} className="max-h-[85vh] w-auto max-w-full object-contain" />
              )}
            </div>

            <div className="border-t border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{post.title}</div>
                  <div className="text-xs text-zinc-400">{post.category} • {post.location}</div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleLike(idx)} className="flex items-center gap-2 text-zinc-100">
                    <Heart className={liked[idx] ? "text-rose-500" : ""} />
                    <span className="text-sm">{likes[idx] || 0}</span>
                  </button>
                  {/* comments removed */}
                </div>
              </div>

              {/* comments UI removed */}

              <div className="mt-2 text-xs text-zinc-400">{idx + 1} of {posts.length}</div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
