// app/users/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import axios from 'axios';
import { LoaderIcon } from "lucide-react";
import { API_URL } from '../../../constants';
import { getHeadersForHttpReq } from '../../../constants/token';

const entity_name = 'User'
const comp_route = 'api/users'

type User = {
  id: string
  user_name: string
  pd?: string
}

export default function UsersPage() {
  const router = useRouter()
  const [data, setData] = useState<User[]>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'user_name', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
    total: 0,
  })
  const [user, setUser] = useState<User | null>(null)
  const [searchValues, setSearchValues] = useState({
    user_name: '',
  })
  const [flags, setFlags] = useState({
    flag1: true,
    flag2: true,
    flag3: true,
    flag4: true,
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Loading data...')

  // Table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'user_name',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>{`${entity_name} Name`}</span>
          <Input
            placeholder={`Search ${entity_name}`}
            onChange={(e) => handleChangeSearchValues('user_name')(e)}
          />
        </div>
      ),
      cell: ({ row }) => <span className="text-base">{row.getValue('user_name')}</span>,
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
      setPagination(newPagination);
      fetch({
        page: newPagination.pageIndex,
        size: newPagination.pageSize,
        sortField: sorting[0]?.id || 'user_name',
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

  // Business Logic Functions (kept exactly the same as original, just converted to TS)
  const handleEditRecord = (record: User) => {
    setUser(record)
    setFlags({ ...flags, flag3: false })
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

  const deleteCategory = async (record: User) => {
    if (!confirm('Sure to delete?')) return
    
    setLoading(true)
    setLoadingMessage('System is deleting record, please wait...')
    const headers = getHeadersForHttpReq()

    try {
      const res = await axios.delete(`${API_URL}${comp_route}/${record.id}`, { headers })
      if (res.data.success) {
        fetch()
        alert(`${entity_name} deleted successfully!`)
      } else {
        alert(res.data.message)
      }
    } catch (err) {
      console.log(`Error occured while deleting the ${entity_name}->`, err)
      alert('System is unable to delete the user!')
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
      user_name: searchValues.user_name,
      page,
      sortColumn: params.sortField || 'user_name',
      sortOrder,
      size: params.size || 5
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

  // Form handlers (simplified without toast)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Your form validation logic here
    // Replace message.success/error with alerts
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Your form validation logic here
    // Replace message.success/error with alerts
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
            <LoaderIcon className="animate-spin" />;
            <p className="text-lg">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Add User Form */}
      <Card>
        <CardHeader>
          <CardTitle>{`Add ${entity_name}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{`${entity_name} Name`}</label>
                  <Input
                    name="user_name4"
                    placeholder={`${entity_name} Name`}
                    onChange={(e) => setFlags({ ...flags, flag1: e.target.value.length === 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    name="password4"
                    placeholder="Password"
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{`Update ${entity_name}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{`${entity_name} Name`}</label>
                <Input
                  name="user_name5"
                  defaultValue={user?.user_name || ''}
                  onChange={(e) => setFlags({ ...flags, flag3: e.target.value.length === 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  name="password5"
                  placeholder="Leave blank to keep current"
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