'use client'

import React, { useState, useEffect } from 'react'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { API_URL } from '../../../constants'
import { getHeadersForHttpReq } from '../../../constants/token'

const comp_route = 'api/euro_trips'
const entity_name = 'Eurotrip'

interface Eurotrip {
  id: string
  search_counter: string
  name: string
  country_name: string
  no_of_days: string
  transportation_type: string
  desc_short: string
  desc_long: string
}

interface Pagination {
  current: number
  pageSize: number
  total: number
}

interface SearchValues {
  name: string
  country_name: string
  no_of_days: string
  transportation_type: string
  desc_short: string
  desc_long: string
}

export default function SearchCountersEurotrips() {
  const [data, setData] = useState<Eurotrip[]>([])
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
    country_name: '',
    no_of_days: '',
    transportation_type: '',
    desc_short: '',
    desc_long: '',
  })
  const [openResetDialog, setOpenResetDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Eurotrip | null>(null)

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
      country_name: params.searchValues?.country_name || searchValues.country_name || '',
      no_of_days: params.searchValues?.no_of_days || searchValues.no_of_days || '',
      transportation_type: params.searchValues?.transportation_type || searchValues.transportation_type || '',
      desc_short: params.searchValues?.desc_short || searchValues.desc_short || '',
      desc_long: params.searchValues?.desc_long || searchValues.desc_long || '',
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

  const resetCategory = async (record: Eurotrip) => {
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Input
            placeholder="Search Name"
            value={searchValues.name}
            onChange={handleChangeSearchValues('name')}
          />
          <Input
            placeholder="Search Country"
            value={searchValues.country_name}
            onChange={handleChangeSearchValues('country_name')}
          />
          <Input
            placeholder="Search Transportation"
            value={searchValues.transportation_type}
            onChange={handleChangeSearchValues('transportation_type')}
          />
          <Input
            placeholder="Search Days"
            value={searchValues.no_of_days}
            onChange={handleChangeSearchValues('no_of_days')}
          />
          <Input
            placeholder="Search Short Desc"
            value={searchValues.desc_short}
            onChange={handleChangeSearchValues('desc_short')}
          />
          <Input
            placeholder="Search Long Desc"
            value={searchValues.desc_long}
            onChange={handleChangeSearchValues('desc_long')}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '13%', textAlign: 'center' }}>Search Counter</TableHead>
                <TableHead style={{ width: '13%' }}>
                  <div className="flex flex-col">
                    <span>Name</span>
                    <Input
                      placeholder="Search Name"
                      value={searchValues.name}
                      onChange={handleChangeSearchValues('name')}
                      className="mt-1"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: '13%' }}>
                  <div className="flex flex-col">
                    <span>Country</span>
                    <Input
                      placeholder="Search Country"
                      value={searchValues.country_name}
                      onChange={handleChangeSearchValues('country_name')}
                      className="mt-1"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: '17%' }}>
                  <div className="flex flex-col">
                    <span>Transportation</span>
                    <Input
                      placeholder="Search Transportation"
                      value={searchValues.transportation_type}
                      onChange={handleChangeSearchValues('transportation_type')}
                      className="mt-1"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: '12%' }}>
                  <div className="flex flex-col">
                    <span>No# of Days</span>
                    <Input
                      placeholder="Search Days"
                      value={searchValues.no_of_days}
                      onChange={handleChangeSearchValues('no_of_days')}
                      className="mt-1"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: '12%' }}>
                  <div className="flex flex-col">
                    <span>Short Description</span>
                    <Input
                      placeholder="Search Short Desc"
                      value={searchValues.desc_short}
                      onChange={handleChangeSearchValues('desc_short')}
                      className="mt-1"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: '12%' }}>
                  <div className="flex flex-col">
                    <span>Long Description</span>
                    <Input
                      placeholder="Search Long Desc"
                      value={searchValues.desc_long}
                      onChange={handleChangeSearchValues('desc_long')}
                      className="mt-1"
                    />
                  </div>
                </TableHead>
                <TableHead style={{ width: '7%', textAlign: 'center' }}>Reset</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell style={{ textAlign: 'center' }}>{record.search_counter}</TableCell>
                  <TableCell className="text-sm">{record.name}</TableCell>
                  <TableCell className="text-sm">{record.country_name}</TableCell>
                  <TableCell className="text-sm">{record.transportation_type}</TableCell>
                  <TableCell className="text-sm">{record.no_of_days}</TableCell>
                  <TableCell className="text-sm truncate max-w-[150px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate">{record.desc_short}</div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{record.desc_short}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[150px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate">{record.desc_long}</div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{record.desc_long}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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