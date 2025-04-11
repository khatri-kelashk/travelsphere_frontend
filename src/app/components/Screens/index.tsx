// app/screens/page.tsx
'use client'

import { useState, useEffect } from 'react'
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
import { LoaderIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import axios from 'axios'

import { API_URL } from '../../../constants';
import { getHeadersForHttpReq } from '../../../constants/token';

const comp_route = 'api/screens'

type Screen = {
  id: string
  name: string
  url: string
  module_id?: string
}

type Module = {
  id: string
  name: string
}

export default function ScreensPage() {
  const [data, setData] = useState<Screen[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
    total: 0,
  })
  const [screen, setScreen] = useState<Screen | null>(null)
  const [searchValues, setSearchValues] = useState({
    name: '',
    url: '',
  })
  const [flags, setFlags] = useState({
    flag1: true,
    flag2: true,
    flag3: true,
    flag4: true,
    flagn: true,
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Loading data...')
  const [modId, setModId] = useState('')

  // Table columns
  const columns: ColumnDef<Screen>[] = [
    {
      accessorKey: 'name',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>Screen Name</span>
          <Input
            placeholder="Search Screen Name"
            onChange={(e) => handleChangeSearchValues('name')(e)}
          />
        </div>
      ),
      cell: ({ row }) => <span className="text-base">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'url',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>URL</span>
          <Input
            placeholder="Search URL"
            onChange={(e) => handleChangeSearchValues('url')(e)}
          />
        </div>
      ),
      cell: ({ row }) => <span className="text-base">{row.getValue('url')}</span>,
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
          onClick={() => deleteCategory(row.original)}
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

  // Business Logic Functions (same as original)
  const handleEditRecord = (record: Screen) => {
    setScreen(record)
    setFlags({ ...flags, flag3: false, flag4: false, flagn: false })
    setModalVisible(true)
  }

  const compareByAlph = (a: string, b: string) => {
    if (a > b) return -1
    if (a < b) return 1
    return 0
  }

  const handleChangeSearchValues = (prop: keyof typeof searchValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValues = { ...searchValues, [prop]: e.target.value }
    setSearchValues(newSearchValues)
    fetch()
  }

  const deleteCategory = async (record: Screen) => {
    if (!confirm('Sure to delete?')) return
    
    setLoading(true)
    setLoadingMessage('System is deleting record, please wait...')
    const headers = getHeadersForHttpReq()

    try {
      const res = await axios.delete(`${API_URL}${comp_route}/${record.id}`, { headers })
      if (res.data.success) {
        fetch()
        alert('Screen deleted successfully!')
      } else {
        alert(res.data.message)
      }
    } catch (err) {
      console.log('Error occurred while deleting the screen:', err)
      alert('System is unable to delete the screen!')
    } finally {
      setLoading(false)
    }
  }

  const getModules = async () => {
    const headers = getHeadersForHttpReq()
    try {
      const result = await axios.get(`${API_URL}api/modules/all_modules`, { headers })
      setModules(result.data.data)
    } catch (err) {
      console.log('Error fetching modules:', err)
    }
  }

  const fetch = async (params: any = {}) => {
    setLoading(true)
    const headers = getHeadersForHttpReq()
    const page = params.page || 0
    const sortOrder = params.sortOrder === 'ascend' ? 'ASC' : 'DESC'

    const requestData = {
      name: searchValues.name,
      url: searchValues.url,
      page,
      sortColumn: params.sortField || 'name',
      sortOrder,
      size: params.size || 5,
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
    const screenName = formData.get('screen_name') as string
    const url = formData.get('url') as string

    if (!screenName || !url) {
      alert('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      setLoadingMessage('Adding screen record, please wait...')
      const headers = getHeadersForHttpReq()

      const { data } = await axios.post(
        `${API_URL}${comp_route}/add`,
        {
          name: screenName,
          url,
          module_id: modId
        },
        { headers }
      )

      if (data.success) {
        fetch()
        alert('Screen added successfully!')
        // Reset form
        ;(e.target as HTMLFormElement).reset()
        setFlags({ ...flags, flag1: true, flag2: true })
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.log('Error adding screen:', err)
      alert('System is unable to add the screen!')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!screen) return

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const screenName = formData.get('screen_name5') as string
    const url = formData.get('url5') as string
    const moduleId = formData.get('module_id5') as string

    try {
      setLoading(true)
      setLoadingMessage('System is updating screen record, please wait...')
      const headers = getHeadersForHttpReq()

      const { data } = await axios.put(
        `${API_URL}${comp_route}/update`,
        {
          name: screenName,
          url,
          module_id: moduleId,
          id: screen.id
        },
        { headers }
      )

      if (data.success) {
        fetch()
        setModalVisible(false)
        setScreen(null)
        alert('Screen updated successfully!')
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.log('Error updating screen:', err)
      alert('System is unable to update the screen!')
    } finally {
      setLoading(false)
    }
  }

  const selectModule = (value: string) => {
    setModId(value)
  }

  // Initial fetch
  useEffect(() => {
    getModules()
    fetch()
  }, [])

  return (
    <div className="space-y-6 p-4">
      {loading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <LoaderIcon className="animate-spin" />
            <p className="text-lg">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Add Screen Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Screen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Screen Name</label>
                  <Input
                    name="screen_name"
                    placeholder="Screen Name"
                    onChange={(e) => setFlags({ ...flags, flag1: e.target.value.length === 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <Input
                    name="url"
                    placeholder="URL"
                    onChange={(e) => setFlags({ ...flags, flag2: e.target.value.length === 0 })}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={flags.flag1 || flags.flag2}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Screens Table */}
      <Card>
        <CardHeader>
          <CardTitle>Screens</CardTitle>
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
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Update Screen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Screen Name</label>
                  <Input
                    name="screen_name5"
                    defaultValue={screen?.name || ''}
                    onChange={(e) => setFlags({ ...flags, flag3: e.target.value.length === 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <Input
                    name="url5"
                    defaultValue={screen?.url || ''}
                    readOnly
                    onChange={(e) => setFlags({ ...flags, flag4: e.target.value.length === 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Module</label>
                  <Select 
                    name="module_id5" 
                    defaultValue={screen?.module_id || ''}
                    onValueChange={selectModule}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={flags.flag3 || flags.flag4 || flags.flagn}
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