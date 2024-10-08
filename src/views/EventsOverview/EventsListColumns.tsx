/* eslint-disable react/prop-types */
import { type ColumnDef } from '@tanstack/react-table'
import { type Event } from '@/lib/index/schemas/event'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { type MouseEvent } from 'react'
import {
  SignalHigh,
  Pen,
  Shapes,
  Clock3Icon,
  Eye,
  Navigation,
  NotebookPen,
  Edit,
  Delete
} from '@ttab/elephant-ui/icons'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Newsvalues, NewsvalueMap, VisibilityStatuses } from '@/defaults'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { Time } from '@/components/Table/Items/Time'
import { Title } from '@/components/Table/Items/Title'
import { Status } from '@/components/Table/Items/Status'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { type IDBSection } from 'src/datastore/types'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'

export function eventTableColumns({ sections = [] }: {
  sections?: IDBSection[]
}): Array<ColumnDef<Event>> {
  return [
    {
      id: 'visibilityStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: VisibilityStatuses,
        name: 'Synlighet',
        columnIcon: Eye,
        className: 'box-content w-6 pr-0'
      },
      accessorFn: (data) => (
        // FIXME: It seems we're not indexing "document.meta.core_event.data.public"
        data._source['document.meta.core_description.role']?.[0]
      ),
      cell: ({ row }) => {
        const visibility = row.getValue<'internal' | 'public'>('visibilityStatus')
        return <StatusIndicator visibility={visibility} />
      },
      filterFn: (row, id, value) => (
        value.includes(row.getValue(id))
      )
    },
    {
      id: 'newsvalue',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: Newsvalues,
        name: 'Nyhetsvärde',
        columnIcon: SignalHigh,
        className: 'box-content w-4 sm:w-8 pr-1 sm:pr-4'
      },
      accessorFn: (data) => data._source['document.meta.core_newsvalue.value']?.[0],
      cell: ({ row }) => {
        const value: string = row.getValue('newsvalue') || ''
        const newsvalue = NewsvalueMap[value]

        if (newsvalue) {
          return <Newsvalue newsvalue={newsvalue} />
        }
      },
      filterFn: (row, id, value) => (
        value.includes(row.getValue(id))
      )
    },
    {
      id: 'title',
      meta: {
        name: 'Slugg',
        columnIcon: Pen,
        className: 'box-content truncate'
      },
      accessorFn: (data) => data._source['document.title'][0],
      cell: ({ row }) => {
        const slugline = row.original._source['document.meta.tt_slugline.value']?.[0]
        const title = row.getValue('title')

        return <Title title={title as string} slugline={slugline} />
      }
    },
    {
      // FIXME: document.rel.section.uuid is not indexed
      id: 'section',
      meta: {
        options: sections.map(_ => {
          return {
            // TODO: Use section uuid for a more stable reference, not yet available on event document
            value: _.title,
            label: _.title
          }
        }),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: 'Sektion',
        columnIcon: Shapes,
        className: 'box-content w-[115px] hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => data._source['document.rel.section.title']?.[0],
      cell: ({ row }) => {
        const sectionTitle = row.getValue<string | undefined>('section')
        return <>
          {sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />}
        </>
      },
      filterFn: (row, id, value) => (
        value.includes(row.getValue(id))
      )
    },
    {
      id: 'planning_status',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: [{ label: 'Planerad', value: 'planned' }, { label: 'Ej planerad', value: 'unplanned' }],
        name: 'Planeringsstatus',
        columnIcon: NotebookPen,
        className: 'box-content w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => Array.isArray(data?._relatedPlannings)
        ? 'planned'
        : 'unplanned',
      cell: ({ row }) => {
        const _status = row.original._relatedPlannings?.[0]
        return <Status status={_status} />
      },
      filterFn: (row, id, value) => (
        value.includes(row.getValue(id))
      )
    },
    // TODO: Use range filter
    {
      id: 'event_time',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: 'Tid',
        columnIcon: Clock3Icon,
        className: 'box-content w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => {
        const startTime = new Date(data._source['document.meta.core_event.data.start'][0])
        const endTime = new Date(data._source['document.meta.core_event.data.end'][0])
        return [startTime, endTime]
      },
      cell: ({ row }) => {
        const startTime = row.getValue<Date[]>('event_time')[0] || undefined
        const endTime = row.getValue<Date[]>('event_time')[1] || undefined
        return <Time startTime={startTime} endTime={endTime} />
      }
    },
    {
      id: 'action',
      meta: {
        name: 'Action',
        columnIcon: Navigation,
        className: 'box-content w-[32px]'
      },
      cell: () => {
        return <DotDropdownMenu items={menuItems} />
      }
    }
  ]
}

const menuItems = [
  {
    label: 'Redigera',
    icon: Edit,
    item: <T extends HTMLElement>(event: MouseEvent<T>) => {
      event.preventDefault()
      event.stopPropagation()
    }
  },
  {
    label: 'Ta bort',
    icon: Delete,
    item: <T extends HTMLElement>(event: MouseEvent<T>) => {
      event.preventDefault()
      event.stopPropagation()
      confirm('Ta bort')
    }
  }
]
