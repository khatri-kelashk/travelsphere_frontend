// app/filters/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { LoaderIcon } from 'lucide-react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import axios from 'axios'
import { API_URL } from '../../../constants'
import { getHeadersForHttpReq } from '../../../constants/token'

const comp_route = 'api/filters'
const entity_name = 'Filter'

type Filter = {
  id: string
  name: string
}

export default function AvailableFiltersPage() {
  const [data, setData] = useState<Filter[]>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
  })
  const [filter, setFilter] = useState<Filter | null>(null)
  const [searchValues, setSearchValues] = useState({
    name: '',
  })
  const [flags, setFlags] = useState({
    flag1: true,
    flag3: true,
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Table columns
  const columns: ColumnDef<Filter>[] = [
    {
      accessorKey: 'name',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>{`${entity_name} Name`}</span>
          <Input
            placeholder={`${entity_name} Name`}
            onChange={(e) => handleChangeSearchValues('name')(e)}
          />
        </div>
      ),
      cell: ({ row }) => <span className="text-base">{row.getValue('name')}</span>,
    },
    {
      id: 'edit',
      cell: ({ row }) => (
        <Button
          variant="link"
          onClick={() => handleEditRecord(row.original)}
        >
          Edit
        </Button>
      ),
    },
    {
      id: 'delete',
      cell: ({ row }) => (
        <Button
          variant="link"
          className="text-destructive"
          onClick={() => deleteFilter(row.original)}
        >
          Delete
        </Button>
      ),
    },
  ]

  // Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    manualPagination: true,
    rowCount: pagination.total,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' 
        ? updater(pagination) 
        : updater
      setPagination(newPagination)
      fetch({
        page: newPagination.pageIndex,
        size: newPagination.pageSize,
        sortField: sorting[0]?.id || 'name',
        sortOrder: sorting[0]?.desc ? 'DESC' : 'ASC',
        ...columnFilters,
      })
    },
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  // Business Logic Functions
  const handleEditRecord = (record: Filter) => {
    setFilter(record)
    setFlags({ ...flags, flag3: false })
    setModalVisible(true)
  }

  const handleChangeSearchValues = (prop: keyof typeof searchValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValues = { ...searchValues, [prop]: e.target.value }
    setSearchValues(newSearchValues)
    fetch()
  }

  const deleteFilter = async (record: Filter) => {
    if (!confirm('Sure to delete?')) return
    
    setLoading(true)
    setLoadingMessage('System is deleting record, please wait...')
    const headers = getHeadersForHttpReq()

    try {
      const res = await axios.delete(`${API_URL}${comp_route}/${record.id}`, { headers })
      if (res.data.success) {
        fetch()
        setFilter(null)
        alert(`${entity_name} deleted successfully!`)
      } else {
        alert(res.data.message)
      }
    } catch (err) {
      console.log(`Error occurred while deleting the ${entity_name}:`, err)
      alert(`System is unable to delete the ${entity_name}!`)
    } finally {
      setLoading(false)
    }
  }

  const fetch = async (params: any = {}) => {
    setLoading(true)
    const headers = getHeadersForHttpReq()
    const page = params.page || 0
    const sortOrder = params.sortOrder === 'ascend' ? 'ASC' : 'DESC'

    const requestData = {
      name: searchValues.name,
      page,
      sortColumn: params.sortField || 'name',
      sortOrder,
      size: params.size || 10,
      orderBy: ''
    }

    try {
      const response = await axios.post(
        `${API_URL}${comp_route}/pagination_table`,
        requestData,
        { headers }
      )

      setData(response.data.data)
      setPagination({
        ...pagination,
        total: response.data.totalElements,
        pageIndex: page,
        pageSize: requestData.size
      })
    } catch (err) {
      console.log('Error fetching pagination data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const name = formData.get('name') as string

    if (!name) {
      alert(`Please enter the ${entity_name} name!`)
      return
    }

    try {
      setLoading(true)
      setLoadingMessage(`Adding ${entity_name} record, please wait...`)
      const headers = getHeadersForHttpReq()

      const { data } = await axios.post(
        `${API_URL}${comp_route}/add`,
        { name },
        { headers }
      )

      if (data.success) {
        fetch()
        alert(`${entity_name} added successfully!`)
        // Reset form
        ;(e.target as HTMLFormElement).reset()
        setFlags({ ...flags, flag1: true })
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.log(`Error adding ${entity_name}:`, err)
      alert(`System is unable to add the ${entity_name}!`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filter) return

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const name = formData.get('name5') as string

    try {
      setLoading(true)
      setLoadingMessage(`System is updating ${entity_name} record, please wait...`)
      const headers = getHeadersForHttpReq()

      const { data } = await axios.put(
        `${API_URL}${comp_route}/update`,
        {
          name,
          id: filter.id
        },
        { headers }
      )

      if (data.success) {
        fetch()
        setModalVisible(false)
        setFilter(null)
        alert(`${entity_name} updated successfully!`)
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.log(`Error updating ${entity_name}:`, err)
      alert(`System is unable to update the ${entity_name}!`)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFlags({ ...flags, flag1: e.target.value.length === 0 })
  }

  const handleFilterChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFlags({ ...flags, flag3: e.target.value.length === 0 })
  }

  // Initial fetch
  useEffect(() => {
    fetch()
  }, [])

  return (
    <div className="space-y-6 p-4">
      {loading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <LoaderIcon className="h-12 w-12 animate-spin" />
            <p className="text-lg">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Add Filter Form */}
      <Card>
        <CardHeader>
          <CardTitle>{`Add ${entity_name}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-start-2">
                  <label className="block text-sm font-medium mb-1">{`${entity_name} Name`}</label>
                  <Input
                    name="name"
                    placeholder={`${entity_name} Name`}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={flags.flag1}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{`Update ${entity_name}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">{`${entity_name} Name`}</label>
                <Input
                  name="name5"
                  defaultValue={filter?.name || ''}
                  onChange={handleFilterChange2}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={flags.flag3}
                >
                  Update
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}