import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { View } from '@/components'
import { Notes } from '@/components/Notes'
import { Bold, Italic, Link, Text, TTVisual, Factbox, Table, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'
import { ImagePlugin } from '../PrintEditor/ImagePlugin'
import { Editor as PlainEditor } from '@/components/PlainEditor'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import { GenAIPlugin } from '@dimelords/textbit-genai-plugin'

import {
  useQuery,
  useLink,
  useWorkflowStatus,
  useRegistry
} from '@/hooks'
import type { ViewMetadata, ViewProps } from '@/types'
import { EditorHeader } from './EditorHeader'
import { Error } from '../Error'
import { GenAISuggestions } from '@/components/GenAISuggestions'
import { GenAILoading } from '@/components/GenAILoading'

import { getValueByYPath } from '@/shared/yUtils'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useSession } from 'next-auth/react'

// Metadata definition
const meta: ViewMetadata = {
  name: 'Editor',
  path: `${import.meta.env.BASE_URL || ''}/editor`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

// Main Editor Component - Handles document initialization
const Editor = (props: ViewProps): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id as string
  const preview = query.preview === 'true'

  const [workflowStatus] = useWorkflowStatus({ documentId })

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <Error
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  // If published or specific version has be specified
  if (workflowStatus?.name === 'usable' || props.version || workflowStatus?.name === 'unpublished') {
    const bigIntVersion = workflowStatus?.name === 'usable'
      ? workflowStatus?.version
      : BigInt(props.version ?? 0)

    return (
      <View.Root>
        <EditorHeader
          ydoc={{ id: documentId } as YDocument<Y.Map<unknown>>}
          readOnly
          readOnlyVersion={bigIntVersion}
        />
        <View.Content className='flex flex-col max-w-[1000px] px-4 h-full' variant='grid'>
          <PlainEditor key={props.version} id={documentId} version={bigIntVersion} />
        </View.Content>
      </View.Root>
    )
  }

  return (
    <EditorWrapper
      {...props}
      preview={preview}
      documentId={documentId}
    />
  )
}

// Main editor wrapper after document initialization
function EditorWrapper(props: ViewProps & {
  documentId: string
  planningId?: string | null
  preview?: boolean
}): JSX.Element {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, {
    visibility: !props.preview
  })
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')
  const [content] = getValueByYPath<Y.XmlText>(ydoc.ele, 'content', true)
  const { data } = useSession()
  const { repository } = useRegistry()
  const openFactboxEditor = useLink('Factbox')
  const openImageSearch = useLink('ImageSearch')
  const openFactboxes = useLink('Factboxes')
  const [genaiSuggestions, setGenaiSuggestions] = useState<Array<{
    id: string
    type: string
    what: string
    why: string
    improvement: string
  }>>([])
  const [genaiSelectedText, setGenaiSelectedText] = useState<string>('')
  const [genaiApplyFn, setGenaiApplyFn] = useState<((improvement: string) => void) | null>(null)
  const [genaiLoading, setGenaiLoading] = useState<boolean>(false)

  // Handle applying a suggestion
  const handleApplySuggestion = (suggestion: typeof genaiSuggestions[0]) => {
    if (genaiApplyFn) {
      // Use the apply function from the plugin to replace text
      genaiApplyFn(suggestion.improvement)
      // Close suggestions panel after applying
      handleDismissSuggestions()
    } else {
      console.error('GenAI: No apply function available')
    }
  }

  const handleDismissSuggestions = () => {
    setGenaiSuggestions([])
    setGenaiSelectedText('')
    setGenaiApplyFn(null)
    setGenaiLoading(false)
  }

  // Plugin configuration
  const configuredPlugins = useMemo(() => {
    return [
      Bold(),
      Italic(),
      Link(),
      ImageSearchPlugin({ openImageSearch }),
      FactboxPlugin({ openFactboxes }),
      Table(),
      LocalizedQuotationMarks(),
      ImagePlugin({
        repository,
        accessToken: data?.accessToken || ''
      }),
      TTVisual({
        enableCrop: false
      }),
      Text({
        countCharacters: ['heading-1'],
        ...contentMenuLabels
      }),
      Factbox({
        onEditOriginal: (id: string) => {
          openFactboxEditor(undefined, { id })
        },
        removable: true
      }),
      GenAIPlugin({
        genaiUrl: import.meta.env.VITE_GENAI_URL || 'http://localhost:1480',
        getAccessToken: async () => data?.accessToken || '',
        language: documentLanguage?.toLowerCase(),
        onRequestStart: () => {
          console.log('GenAI: Sending language:', documentLanguage?.toLowerCase())
          setGenaiLoading(true)
        },
        onRequestEnd: () => {
          setGenaiLoading(false)
        },
        onSuggestionReceived: (
          suggestions: Array<{ id: string; type: string; what: string; why: string; improvement: string }>,
          selectedText: string,
          applyFn: (improvement: string) => void
        ) => {
          console.log('GenAI suggestions received:', suggestions)
          setGenaiSuggestions(suggestions)
          setGenaiSelectedText(selectedText)
          // Store the apply function in state
          setGenaiApplyFn(() => applyFn)
        }
      })
    ]
  }, [openFactboxEditor, openFactboxes, openImageSearch, data, repository, documentLanguage])

  if (!content) {
    return <View.Root />
  }

  return (
    <View.Root>
      <BaseEditor.Root
        ydoc={ydoc}
        content={content}
        readOnly={props.preview}
        plugins={configuredPlugins}
        lang={documentLanguage}
      >
        <EditorHeader ydoc={ydoc} planningId={props.planningId} readOnly={props.preview} />

        <Notes ydoc={ydoc} />

        <View.Content className='flex flex-col max-w-[1000px]'variant='grid'>
          <div className='grow overflow-auto pr-12 max-w-(--breakpoint-xl)'>
            <BaseEditor.Text
              ydoc={ydoc}
              autoFocus={true}
            />
          </div>
        </View.Content>

        <View.Footer>
          <BaseEditor.Footer />
        </View.Footer>
      </BaseEditor.Root>

      {/* GenAI Loading Indicator */}
      <GenAILoading visible={genaiLoading} />

      {/* GenAI Suggestions Panel */}
      {genaiSuggestions.length > 0 && (
        <GenAISuggestions
          suggestions={genaiSuggestions}
          selectedText={genaiSelectedText}
          onApply={handleApplySuggestion}
          onDismiss={handleDismissSuggestions}
        />
      )}
    </View.Root>
  )
}

Editor.meta = meta

export { Editor }
