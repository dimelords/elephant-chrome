import { Sparkles } from 'lucide-react'

interface GenAILoadingProps {
  visible: boolean
}

export function GenAILoading({ visible }: GenAILoadingProps) {
  if (!visible) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-200">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-md shadow-sm">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span className="text-xs font-medium">AI</span>
      </div>
    </div>
  )
}
