import { useState } from 'react'
import { X, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Button } from '@ttab/elephant-ui'

// Simple utility to merge class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ')
}

interface Suggestion {
  id: string
  type: string
  what: string
  why: string
  improvement: string
}

interface GenAISuggestionsProps {
  suggestions: Suggestion[]
  onApply: (suggestion: Suggestion) => void
  onDismiss: () => void
  selectedText: string
}

const typeColors: Record<string, string> = {
  grammar: 'text-red-600 bg-red-50 border-red-200',
  style: 'text-blue-600 bg-blue-50 border-blue-200',
  clarity: 'text-purple-600 bg-purple-50 border-purple-200',
  tone: 'text-amber-600 bg-amber-50 border-amber-200',
  structure: 'text-green-600 bg-green-50 border-green-200'
}

const typeLabels: Record<string, string> = {
  grammar: 'Grammatik',
  style: 'Stil',
  clarity: 'Klarhet',
  tone: 'Ton',
  structure: 'Struktur'
}

export function GenAISuggestions({
  suggestions,
  onApply,
  onDismiss,
  selectedText
}: GenAISuggestionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(suggestions[0]?.id || null)

  if (suggestions.length === 0) {
    return null
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="fixed top-4 right-4 w-80 max-h-[500px] overflow-hidden flex flex-col bg-white rounded-md shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <h3 className="text-sm font-medium text-gray-900">AI-förslag</h3>
          <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
            {suggestions.length}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={cn(
              "border-b border-gray-100 last:border-b-0",
              expandedId === suggestion.id && "bg-gray-50"
            )}
          >
            {/* Suggestion header */}
            <button
              onClick={() => toggleExpanded(suggestion.id)}
              className="w-full px-3 py-2 flex items-start gap-2 hover:bg-gray-50 transition-colors text-left"
            >
              <span className={cn(
                "px-1.5 py-0.5 text-xs font-medium rounded border mt-0.5 flex-shrink-0",
                typeColors[suggestion.type] || typeColors.structure
              )}>
                {typeLabels[suggestion.type] || 'Övrigt'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-900 line-clamp-2">
                  {suggestion.what}
                </p>
              </div>
              {expandedId === suggestion.id ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              )}
            </button>

            {/* Expanded content */}
            {expandedId === suggestion.id && (
              <div className="px-3 pb-2 space-y-2">
                {/* Why section */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">
                    Varför
                  </p>
                  <p className="text-xs text-gray-700">
                    {suggestion.why}
                  </p>
                </div>

                {/* Improvement preview */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">
                    Förbättring
                  </p>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <p className="text-xs text-gray-900">
                      {suggestion.improvement}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1.5 pt-1">
                  <Button
                    onClick={() => onApply(suggestion)}
                    size="sm"
                    className="flex-1 h-7 text-xs bg-purple-600 hover:bg-purple-700"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Använd
                  </Button>
                  <Button
                    onClick={() => toggleExpanded('')}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Stäng
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
