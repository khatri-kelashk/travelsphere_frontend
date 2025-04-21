'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { API_URL } from '../../../constants'
import { getHeadersForHttpReq } from '../../../constants/token'

const comp_route = 'api/categories'
const entity_name = 'Category'

interface Category {
  id: string
  search_counter: string
  name: string
  category_name: string
}

interface Pagination {
  current: number
  pageSize: number
  total: number
}

interface SearchValues {
  name: string
  category_name: string
}

export default function SearchCountersCategories() {
  const [data, setData] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 5,
    total: 0,
  })
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('ascend')
  const [searchValues, setSearchValues] = useState<SearchValues>({
    name: '',
    category_name: '',
  })
  const [openResetDialog, setOpenResetDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Category | null>(null)

  const compareByAlph = (a: string, b: string) => {
    if (a > b) return -1
    if (a < b) return 1
    return 0
  }

  const handleChangePagination = (
    pagination: Pagination,
    sorter?: { field?: string; order?: 'ascend' | 'descend' }
  ) => {
    setPagination(pagination)
    if (sorter?.field) setSortField(sorter.field)
    if (sorter?.order) setSortOrder(sorter.order)
    fetchData({
      page: pagination.current,
      sortField: sorter?.field || sortField,
      sortOrder: sorter?.order || sortOrder,
    })
  }

  const handleChangeSearchValues = (prop: keyof SearchValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValues = { ...searchValues, [prop]: e.target.value }
    setSearchValues(newSearchValues)
    fetchData({ searchValues: newSearchValues })
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (params: {
    page?: number
    sortField?: string
    sortOrder?: 'ascend' | 'descend'
    searchValues?: SearchValues
  } = {}) => {
    setLoading(true)
    const headers = getHeadersForHttpReq()

    const page = params.page ? params.page - 1 : 0
    const sortOrder = params.sortOrder === 'ascend' ? 'ASC' : params.sortOrder === 'descend' ? 'DESC' : 'ASC'

    const data = {
      _tracking: '1',
      name: params.searchValues?.name || searchValues.name || '',
      category_name: params.searchValues?.category_name || searchValues.category_name || '',
      page,
      sortColumn: params.sortField || sortField || 'name',
      sortOrder,
      size: pagination.pageSize,
      orderBy: '',
    }

    try {
      const response = await axios.post(`${API_URL}${comp_route}/pagination_table`, data, { headers })
      setPagination({
        ...pagination,
        total: response.data.totalElements,
        current: page + 1,
      })
      setData(response.data.data)
    } catch (err) {
      console.error('Error occurred while fetching pagination data:', err)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const resetCategory = async (record: Category) => {
    setLoading(true)
    setLoadingMessage('System is resetting Counter, please wait...')
    const headers = getHeadersForHttpReq()

    try {
      const res = await axios.get(`${API_URL}${comp_route}/reset_count_qwt/${record.id}`, { headers })
      if (res.data.success) {
        fetchData()
        toast.success('Counter reset successfully!')
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      console.error(`Error occurred while resetting the ${entity_name}:`, err)
      toast.error(`System is unable to reset the ${entity_name}!`)
    } finally {
      setLoading(false)
      setLoadingMessage('')
      setOpenResetDialog(false)
    }
  }

  const columns = [
    {
      title: 'Search Counter',
      dataIndex: 'search_counter',
      key: 'search_counter',
      width: '17.6%',
      align: 'center' as const,
    },
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      width: '34%',
      align: 'left' as const,
      sorter: (a: Category, b: Category) => compareByAlph(a.name, b.name),
      render: (text: string) => <span className="text-base">{text}</span>,
    },
    {
      title: 'Category Type',
      dataIndex: 'category_name',
      key: 'category_name',
      width: '34%',
      align: 'left' as const,
      sorter: (a: Category, b: Category) => compareByAlph(a.category_name, b.category_name),
      render: (text: string) => <span className="text-base">{text}</span>,
    },
    {
      title: 'Reset',
      key: 'reset_btn',
      width: '7%',
      align: 'center' as const,
      render: (_: any, record: Category) => (
        <Button
          variant="link"
          onClick={() => {
            setSelectedRecord(record)
            setOpenResetDialog(true)
          }}
        >
          Reset
        </Button>
      ),
    },
  ]

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
          <div className="flex flex-col items-center">
            <LoaderIcon className="h-8 w-8 animate-spin" />
            {loadingMessage && <p className="mt-2">{loadingMessage}</p>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex space-x-4">
          <Input
            placeholder="Search Category Name"
            value={searchValues.name}
            onChange={handleChangeSearchValues('name')}
            className="max-w-md"
          />
          <Input
            placeholder="Search Category Type"
            value={searchValues.category_name}
            onChange={handleChangeSearchValues('category_name')}
            className="max-w-md"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    style={{ width: column.width, textAlign: column.align }}
                  >
                    {column.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell style={{ textAlign: 'center' }}>
                    {record.search_counter}
                  </TableCell>
                  <TableCell>
                    <span className="text-base">{record.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-base">{record.category_name}</span>
                  </TableCell>
                  <TableCell style={{ textAlign: 'center' }}>
                    <Button
                      variant="link"
                      onClick={() => {
                        setSelectedRecord(record)
                        setOpenResetDialog(true)
                      }}
                    >
                      Reset
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={openResetDialog} onOpenChange={setOpenResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the counter for {selectedRecord?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRecord && resetCategory(selectedRecord)}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}