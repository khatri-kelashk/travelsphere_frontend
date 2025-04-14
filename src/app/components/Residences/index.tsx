'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios';
import { toast } from "sonner";
import { API_URL } from '../../../constants'
import { getHeadersForHttpReq } from '../../../constants/token'
import { LoaderIcon, Plus } from 'lucide-react'

// Import ShadCN components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"

const comp_route = 'api/residencies'
const entity_name = 'Hotel'

// Define TypeScript interfaces
interface Hotel {
  id: string
  name: string
  country_name: string
  region_name: string
  resd_type_name: string
  agency_name: string
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

export default function HotelsList() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 5,
    total: 0
  })
  const [searchValues, setSearchValues] = useState<SearchValues>({
    name: '',
    country_name: '',
    region_name: '',
    resd_type_name: '',
    agency_name: '',
    desc_short: '',
    desc_long: '',
  })
  const [sortConfig, setSortConfig] = useState({
    field: 'name',
    order: 'ascend'
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hotelToDelete, setHotelToDelete] = useState<Hotel | null>(null)

  // Fetch data from API
  const fetchHotels = async (params: any = {}) => {
    try {
      setIsLoading(true)
      const headers = getHeadersForHttpReq()

      const page = params.page || pagination.current
      const sortOrder = sortConfig.order === 'ascend' ? 'ASC' : 'DESC'
      const sortField = params.sortField || sortConfig.field

      const data = {
        name: searchValues.name,
        country_name: searchValues.country_name,
        region_name: searchValues.region_name,
        resd_type_name: searchValues.resd_type_name,
        agency_name: searchValues.agency_name,
        desc_short: searchValues.desc_short,
        desc_long: searchValues.desc_long,
        page: page - 1,
        sortColumn: sortField,
        sortOrder,
        size: pagination.pageSize
      }

      const response = await axios.post(`${API_URL}${comp_route}/pagination_table`, data, { headers })

      setHotels(response.data.data)
      setPagination({
        ...pagination,
        current: page,
        total: response.data.totalElements
      })
    } catch (error) {
      console.error('Error fetching hotels:', error)
    //   toast({
    //     variant: 'destructive',
    //     title: 'Error',
    //     description: 'Failed to load hotels data'
    //   })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search input changes
  const handleSearchChange = (field: keyof SearchValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValues = { ...searchValues, [field]: e.target.value }
    setSearchValues(newSearchValues)
    fetchHotels()
  }

  // Handle sorting
  const handleSort = (field: string) => {
    const order = sortConfig.field === field && sortConfig.order === 'ascend' ? 'descend' : 'ascend'
    setSortConfig({ field, order })
    fetchHotels({ sortField: field, sortOrder: order })
  }

  // Handle pagination
  const handlePaginationChange = (page: number) => {
    setPagination({ ...pagination, current: page })
    fetchHotels({ page })
  }

  // Handle edit
  const handleEdit = (hotel: Hotel) => {
    localStorage.setItem('updHotel', JSON.stringify(hotel))
    router.push('/dashboard/update_hotel')
  }

  // Handle delete confirmation
  const handleDeleteClick = (hotel: Hotel) => {
    setHotelToDelete(hotel)
    setDeleteDialogOpen(true)
  }

  // Handle delete
  const handleDelete = async () => {
    if (!hotelToDelete) return

    try {
      setIsLoading(true)
      setLoadingMessage('Deleting hotel, please wait...')
      setDeleteDialogOpen(false)

      const headers = getHeadersForHttpReq()
      const response = await axios.delete(`${API_URL}${comp_route}/${hotelToDelete.id}`, { headers })

      if (response.data.success) {
        // toast({
        //   title: 'Success',
        //   description: `${entity_name} deleted successfully!`
        // })
        fetchHotels()
      } else {
        // toast({
        //   variant: 'destructive',
        //   title: 'Error',
        //   description: response.data.message
        // })
      }
    } catch (error) {
      console.error('Error deleting hotel:', error)
    //   toast({
    //     variant: 'destructive',
    //     title: 'Error',
    //     description: 'Failed to delete hotel'
    //   })
    } finally {
      setIsLoading(false)
      setHotelToDelete(null)
    }
  }

  // Initialize component
  useEffect(() => {
    fetchHotels()
  }, [])

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortConfig.field === field) {
      return sortConfig.order === 'ascend' ? '↑' : '↓'
    }
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading && loadingMessage ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-2">
            <LoaderIcon className="h-6 w-6 animate-spin" />
            <span>{loadingMessage}</span>
          </div>
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Hotels</h2>
            <Link href="/dashboard/add_hotel">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Hotel
              </Button>
            </Link>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex flex-col">
                      <span>{`${entity_name} Name`}</span>
                      <Input
                        placeholder={`Search ${entity_name} Name`}
                        onChange={handleSearchChange('name')}
                        value={searchValues.name}
                        className="mt-1"
                      />
                    </div>
                    {renderSortIndicator('name')}
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('country_name')}
                  >
                    <div className="flex flex-col">
                      <span>Country</span>
                      <Input
                        placeholder="Search Country"
                        onChange={handleSearchChange('country_name')}
                        value={searchValues.country_name}
                        className="mt-1"
                      />
                    </div>
                    {renderSortIndicator('country_name')}
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('region_name')}
                  >
                    <div className="flex flex-col">
                      <span>Region</span>
                      <Input
                        placeholder="Search Region"
                        onChange={handleSearchChange('region_name')}
                        value={searchValues.region_name}
                        className="mt-1"
                      />
                    </div>
                    {renderSortIndicator('region_name')}
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('resd_type_name')}
                  >
                    <div className="flex flex-col">
                      <span>Hotel Type</span>
                      <Input
                        placeholder="Search Hotel Type"
                        onChange={handleSearchChange('resd_type_name')}
                        value={searchValues.resd_type_name}
                        className="mt-1"
                      />
                    </div>
                    {renderSortIndicator('resd_type_name')}
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('agency_name')}
                  >
                    <div className="flex flex-col">
                      <span>Agency</span>
                      <Input
                        placeholder="Search Agency"
                        onChange={handleSearchChange('agency_name')}
                        value={searchValues.agency_name}
                        className="mt-1"
                      />
                    </div>
                    {renderSortIndicator('agency_name')}
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('desc_long')}
                  >
                    <div className="flex flex-col">
                      <span>Long Description</span>
                      <Input
                        placeholder="Search Long Description"
                        onChange={handleSearchChange('desc_long')}
                        value={searchValues.desc_long}
                        className="mt-1"
                      />
                    </div>
                    {renderSortIndicator('desc_long')}
                  </TableHead>
                  
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell className="font-medium">{hotel.name}</TableCell>
                    <TableCell>{hotel.country_name}</TableCell>
                    <TableCell>{hotel.region_name}</TableCell>
                    <TableCell>{hotel.resd_type_name}</TableCell>
                    <TableCell>{hotel.agency_name}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-ellipsis overflow-hidden whitespace-nowrap max-w-[200px]">
                              {hotel.desc_long}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{hotel.desc_long}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="flex justify-center space-x-2">
                      <Button
                        variant="link"
                        onClick={() => handleEdit(hotel)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        className="text-red-500"
                        onClick={() => handleDeleteClick(hotel)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end mt-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                disabled={pagination.current === 1}
                onClick={() => handlePaginationChange(1)}
              >
                First
              </Button>
              <Button
                variant="outline"
                disabled={pagination.current === 1}
                onClick={() => handlePaginationChange(pagination.current - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <Button
                variant="outline"
                disabled={pagination.current === Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => handlePaginationChange(pagination.current + 1)}
              >
                Next
              </Button>
              <Button
                variant="outline"
                disabled={pagination.current === Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => handlePaginationChange(Math.ceil(pagination.total / pagination.pageSize))}
              >
                Last
              </Button>
            </div>
          </div>

          {/* Delete confirmation dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the hotel record.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-500 hover:bg-red-600"
                  onClick={handleDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}