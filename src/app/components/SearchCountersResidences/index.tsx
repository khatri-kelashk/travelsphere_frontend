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

const comp_route = 'api/residencies'
const entity_name = 'Hotel'

interface Residence {
  id: string
  search_counter: string
  name: string
  country_name: string
  region_name: string
  resd_type_name: string
  agency_name: string
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
  region_name: string
  resd_type_name: string
  agency_name: string
  desc_short: string
  desc_long: string
}

export default function SearchCountersResidences() {
  const [data, setData] = useState<Residence[]>([])
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
    region_name: '',
    resd_type_name: '',
    agency_name: '',
    desc_short: '',
    desc_long: '',
  })
  const [openResetDialog, setOpenResetDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Residence | null>(null)

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

    const requestData = {
      _tracking: '1',
      name: params.searchValues?.name || searchValues.name || '',
      country_name: params.searchValues?.country_name || searchValues.country_name || '',
      region_name: params.searchValues?.region_name || searchValues.region_name || '',
      resd_type_name: params.searchValues?.resd_type_name || searchValues.resd_type_name || '',
      agency_name: params.searchValues?.agency_name || searchValues.agency_name || '',
      desc_short: params.searchValues?.desc_short || searchValues.desc_short || '',
      desc_long: params.searchValues?.desc_long || searchValues.desc_long || '',
      page,
      sortColumn: params.sortField || sortField || 'name',
      sortOrder,
      size: pagination.pageSize,
      orderBy: '',
    }

    try {
      const response = await axios.post(`${API_URL}${comp_route}/pagination_table`, requestData, { headers })
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

  const resetCategory = async (record: Residence) => {
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            placeholder="Search Region"
            value={searchValues.region_name}
            onChange={handleChangeSearchValues('region_name')}
          />
          <Input
            placeholder="Search Hotel Type"
            value={searchValues.resd_type_name}
            onChange={handleChangeSearchValues('resd_type_name')}
          />
          <Input
            placeholder="Search Agency"
            value={searchValues.agency_name}
            onChange={handleChangeSearchValues('agency_name')}
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

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '13.5%', textAlign: 'center' }}>Search Counter</TableHead>
                <TableHead style={{ width: '12.5%' }}>Name</TableHead>
                <TableHead style={{ width: '12.5%' }}>Country</TableHead>
                <TableHead style={{ width: '12.5%' }}>Region</TableHead>
                <TableHead style={{ width: '11.5%' }}>Hotel Type</TableHead>
                <TableHead style={{ width: '12.5%' }}>Agency</TableHead>
                <TableHead style={{ width: '9.5%' }}>Short Description</TableHead>
                <TableHead style={{ width: '9.5%' }}>Long Description</TableHead>
                <TableHead style={{ width: '7%', textAlign: 'center' }}>Reset</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell style={{ textAlign: 'center' }}>{record.search_counter}</TableCell>
                  <TableCell className="text-sm">{record.name}</TableCell>
                  <TableCell className="text-sm">{record.country_name}</TableCell>
                  <TableCell className="text-sm">{record.region_name}</TableCell>
                  <TableCell className="text-sm">{record.resd_type_name}</TableCell>
                  <TableCell className="text-sm">{record.agency_name}</TableCell>
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