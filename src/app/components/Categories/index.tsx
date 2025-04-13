// app/categories/page.tsx
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import axios from 'axios'
import { API_URL } from '../../../constants'
import { getHeadersForHttpReq } from '../../../constants/token'

const comp_route = 'api/categories'

type Category = {
  id: string
  name: string
  category_name: string
  category_type: string
  parent_id?: string
  is_parent: boolean
  _tracking: number
}

type CategoryType = {
  id: string
  name: string
}

type ParentCategory = {
  id: string
  name: string
}

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([])
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([])
  const [parents, setParents] = useState<ParentCategory[]>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
    total: 0,
  })
  const [category, setCategory] = useState<Category | null>(null)
  const [searchValues, setSearchValues] = useState({
    name: '',
    category_name: ''
  })
  const [flags, setFlags] = useState({
    flag1: true,
    flag2: true,
    flag3: true,
    flag4: true,
  })
  const [isParent, setIsParent] = useState(false)
  const [tracking, setTracking] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Loading data...')

  // Table columns
  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'name',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>Category Name</span>
          <Input
            placeholder="Search Category Name"
            onChange={(e) => handleChangeSearchValues('name')(e)}
          />
        </div>
      ),
      cell: ({ row }) => <span className="text-base">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'category_name',
      header: 'Category Type',
      cell: ({ row }) => <span className="text-base">{row.getValue('category_name')}</span>,
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

  // Business Logic Functions
  const handleEditRecord = (record: Category) => {
    setCategory(record)
    setFlags({ ...flags, flag3: false, flag4: false })
    setModalVisible(true)
  }

  const handleChangeSearchValues = (prop: keyof typeof searchValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValues = { ...searchValues, [prop]: e.target.value }
    setSearchValues(newSearchValues)
    fetch()
  }

  const deleteCategory = async (record: Category) => {
    if (!confirm('Sure to delete?')) return
    
    setLoading(true)
    setLoadingMessage('System is deleting record, please wait...')
    const headers = getHeadersForHttpReq()

    try {
      const res = await axios.delete(`${API_URL}${comp_route}/${record.id}`, { headers })
      if (res.data.success) {
        fetch()
        getParents()
        alert('Category deleted successfully!')
      } else {
        alert(res.data.message)
      }
    } catch (err) {
      console.log('Error occurred while deleting the Category:', err)
      alert('System is unable to delete the Category!')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryTypes = async () => {
    const headers = getHeadersForHttpReq()
    try {
      const result = await axios.get(`${API_URL}api/category_types/all_category_types`, { headers })
      setCategoryTypes(result.data.data)
    } catch (err) {
      console.log('Error fetching category types:', err)
    }
  }

  const getParents = async () => {
    const headers = getHeadersForHttpReq()
    try {
      const result = await axios.get(`${API_URL}${comp_route}/get_parents`, { headers })
      setParents(result.data.data)
    } catch (err) {
      console.log('Error fetching parents:', err)
    }
  }

  const fetch = async (params: any = {}) => {
    setLoading(true)
    const headers = getHeadersForHttpReq()
    const page = params.page || 0
    const sortOrder = params.sortOrder === 'ascend' ? 'DESC' : 'ASC'

    const requestData = {
      name: searchValues.name,
      category_name: searchValues.category_name,
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
    const name = formData.get('category_name') as string
    const category_type = formData.get('category_type') as string
    const parent_id = formData.get('parent_id') as string

    if (!name || !category_type) {
      alert('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      setLoadingMessage('Adding new Category, please wait...')
      const headers = getHeadersForHttpReq()

      const { data } = await axios.post(
        `${API_URL}${comp_route}/add`,
        {
          name,
          category_type,
          _tracking: tracking,
          is_parent: isParent,
          parent_id: !isParent ? parent_id : ''
        },
        { headers }
      )

      if (data.success) {
        fetch()
        getParents()
        // Reset form
        ;(e.target as HTMLFormElement).reset()
        setFlags({ ...flags, flag1: true, flag2: true })
        setTracking(0)
        setIsParent(false)
        alert('Category added successfully!')
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.log('Error adding Category:', err)
      alert('System is unable to add the Category!')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const name = formData.get('category_name5') as string
    const category_type = formData.get('category_type5') as string
    const parent_id = formData.get('parent_id5') as string

    try {
      setLoading(true)
      setLoadingMessage('System is updating new Category, please wait...')
      const headers = getHeadersForHttpReq()

      const { data } = await axios.put(
        `${API_URL}${comp_route}/update`,
        {
          id: category.id,
          name,
          category_type,
          parent_id,
          is_parent: category.is_parent,
          _tracking: category._tracking
        },
        { headers }
      )

      if (data.success) {
        fetch()
        getParents()
        setModalVisible(false)
        setCategory(null)
        alert('Category updated successfully!')
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.log('Error updating Category:', err)
      alert('System is unable to update the Category!')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFlags({ ...flags, flag1: e.target.value.length === 0 })
  }

  const handleCategoryTypeChange = (value: string) => {
    setFlags({ ...flags, flag2: value.length === 0 })
  }

  const handleCategoryChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!category) return
    setFlags({ ...flags, flag3: e.target.value.length === 0 })
    setCategory({ ...category, name: e.target.value })
  }

  const handleCategoryTypeChange2 = (value: string) => {
    if (!category) return
    setFlags({ ...flags, flag4: value.length === 0 })
    setCategory({ ...category, category_type: value })
  }

  const handleSearchCounter = (checked: boolean) => {
    setTracking(checked ? 1 : 0)
  }

  const handleSearchCounterUpdate = (checked: boolean) => {
    if (!category) return
    setCategory({ ...category, _tracking: checked ? 1 : 0 })
  }

  const handleParentCheckbox = (checked: boolean) => {
    setIsParent(checked)
  }

  const handleParentCheckboxUpdate = (checked: boolean) => {
    if (!category) return
    setCategory({ ...category, is_parent: checked })
  }

  // Initial fetch
  useEffect(() => {
    const initializeData = async () => {
      await getCategoryTypes()
      await getParents()
      await fetch()
    }
    initializeData()
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

      {/* Add Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Category Name</Label>
                  <Input
                    name="category_name"
                    placeholder="Category Name"
                    onChange={handleCategoryChange}
                  />
                </div>
                <div>
                  <Label>Category Type</Label>
                  <Select
                    name="category_type"
                    onValueChange={handleCategoryTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category type" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryTypes.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tracking"
                    checked={tracking === 1}
                    onCheckedChange={(checked) => handleSearchCounter(!!checked)}
                  />
                  <Label htmlFor="tracking">Add Search Counter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isParent"
                    checked={isParent}
                    onCheckedChange={handleParentCheckbox}
                  />
                  <Label htmlFor="isParent">Is Parent Category</Label>
                </div>
                <div>
                  <Label>Parent Category</Label>
                  <Select
                    name="parent_id"
                    disabled={isParent}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={flags.flag1 || flags.flag2}
                  className="w-full md:w-auto"
                >
                  Add
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
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
            <DialogTitle>Update Category</DialogTitle>
          </DialogHeader>
          {category && (
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Category Name</Label>
                    <Input
                      name="category_name5"
                      defaultValue={category.name}
                      onChange={handleCategoryChange2}
                    />
                  </div>
                  <div>
                    <Label>Category Type</Label>
                    <Select
                      name="category_type5"
                      defaultValue={category.category_type}
                      onValueChange={handleCategoryTypeChange2}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category type" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryTypes.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tracking-update"
                      checked={category._tracking === 1}
                      onCheckedChange={(checked) => handleSearchCounterUpdate(!!checked)}
                    />
                    <Label htmlFor="tracking-update">Add Search Counter</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isParent-update"
                      checked={category.is_parent}
                      onCheckedChange={handleParentCheckboxUpdate}
                    />
                    <Label htmlFor="isParent-update">Is Parent Category</Label>
                  </div>
                  <div>
                    <Label>Parent Category</Label>
                    <Select
                      name="parent_id5"
                      defaultValue={category.parent_id || ''}
                      disabled={category.is_parent}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        {parents.map(m => (
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
                    disabled={flags.flag3 || flags.flag4}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}