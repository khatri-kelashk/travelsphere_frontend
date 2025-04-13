'use client' // Since we're using client-side functionality

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { API_URL } from '../../../constants'
import { getHeadersForHttpReq } from '../../../constants/token'
import { LoaderIcon } from 'lucide-react'

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const comp_route = 'api/residencies'
const entity_name = 'Hotel'

// Define TypeScript interfaces
interface Country {
  id: string
  category_name: string
}

interface Agency {
  id: string
  name: string
}

interface Filter {
  id: string
  name: string
  value: string | number
  resd_id?: string
}

interface Region {
  id: string
  category_name: string
}

interface HotelType {
  id: string
  category_name: string
}

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, `${entity_name} name is required`),
  country_id: z.string().min(1, 'Country is required'),
  region_id: z.string().min(1, 'Region is required'),
  agency_id: z.string().min(1, 'Agency is required'),
  resd_type_id: z.string().min(1, `${entity_name} type is required`),
  desc_short: z.string().optional(),
  desc_long: z.string().optional(),
  _tracking: z.boolean().optional()
})

export default function ResidenceAdd() {
//   const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [countries, setCountries] = useState<Country[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [filters, setFilters] = useState<Filter[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [hotelTypes, setHotelTypes] = useState<HotelType[]>([])
  const [selectedFilterId, setSelectedFilterId] = useState<string>('')
  const [tracking, setTracking] = useState<number>(0)

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      country_id: '',
      region_id: '',
      agency_id: '',
      resd_type_id: '',
      desc_short: '',
      desc_long: '',
      _tracking: false
    }
  })

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        await Promise.all([
          getAvailableFilters(),
          getAgencies(),
          getCategoriesByType('COUNTRY', setCountries),
          getCategoriesByType('REGION', setRegions),
          getCategoriesByType('HOTEL TYPE', setHotelTypes)
        ])
      } catch (error) {
        console.error('Error fetching initial data:', error)
        // toast({
        //   variant: 'destructive',
        //   title: 'Error',
        //   description: 'Failed to load initial data'
        // })
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // API functions
  const getAvailableFilters = async () => {
    const headers = getHeadersForHttpReq()
    try {
      const response = await axios.get(`${API_URL}api/filters/all_avble_filters`, { headers })
      setFilters(response.data.data)
    } catch (error) {
      console.error('Error fetching filters:', error)
      throw error
    }
  }

  const getAgencies = async () => {
    const headers = getHeadersForHttpReq()
    try {
      const response = await axios.get(`${API_URL}api/agencies/all_agencies`, { headers })
      setAgencies(response.data.data)
    } catch (error) {
      console.error('Error fetching agencies:', error)
      throw error
    }
  }

  const getCategoriesByType = async (category_type: string, setter: (data: any[]) => void) => {
    const headers = getHeadersForHttpReq()
    try {
      const response = await axios.get(
        `${API_URL}api/categories/get_constants_by_type/${category_type}`,
        { headers }
      )
      setter(response.data.data)
    } catch (error) {
      console.error(`Error fetching ${category_type}:`, error)
      throw error
    }
  }

  // Filter handlers
  const onChangeCheckbox = (record: Filter) => {
    const updatedFilters = filters.map(filter => 
      filter.id === record.id 
        ? { ...filter, value: filter.value === '0' ? '1' : '0' } 
        : filter
    )
    setFilters(updatedFilters)
  }

  const onRadioBtnSelection = (record: Filter) => {
    setSelectedFilterId(record.id)
    onChangeCheckbox(record)
  }

  const resetAvailableFilters = () => {
    const resetFilters = filters.map(filter => ({ ...filter, value: '0' }))
    setFilters(resetFilters)
    setSelectedFilterId('')
  }

  // Form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      setLoadingMessage(`Adding ${entity_name} record, please wait...`)
      
      const data = {
        name: values.name,
        country_id: values.country_id,
        region_id: values.region_id,
        agency_id: values.agency_id,
        resd_type_id: values.resd_type_id,
        desc_short: values.desc_short,
        desc_long: values.desc_long,
        filters: JSON.stringify(filters),
        _tracking: tracking,
      }

      const headers = getHeadersForHttpReq()
      const response = await axios.post(`${API_URL}${comp_route}/add`, data, { headers })

      if (response.data.success) {
        resetAvailableFilters()
        form.reset()
        // toast({
        //   title: 'Success',
        //   description: `${entity_name} added successfully!`
        // })
      } else {
        // toast({
        //   variant: 'destructive',
        //   title: 'Error',
        //   description: response.data.message
        // })
      }
    } catch (error) {
      console.error(`Error adding ${entity_name}:`, error)
    //   toast({
    //     variant: 'destructive',
    //     title: 'Error',
    //     description: `System is unable to add the ${entity_name}!`
    //   })
    } finally {
      setIsLoading(false)
    }
  }

  // Form validation helpers
  const isFormValid = () => {
    return (
      form.getValues('name') &&
      form.getValues('country_id') &&
      form.getValues('region_id') &&
      form.getValues('agency_id') &&
      form.getValues('resd_type_id')
    )
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{`Add ${entity_name}`}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Hotel Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{`${entity_name} Name`}</FormLabel>
                      <FormControl>
                        <Input placeholder={`${entity_name} Name`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Country */}
                <FormField
                  control={form.control}
                  name="country_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{`${entity_name} Country`}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Region */}
                <FormField
                  control={form.control}
                  name="region_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{`${entity_name} Region`}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map(region => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Agency */}
                  <FormField
                    control={form.control}
                    name="agency_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an agency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {agencies.map(agency => (
                              <SelectItem key={agency.id} value={agency.id}>
                                {agency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Hotel Type */}
                  <FormField
                    control={form.control}
                    name="resd_type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{`${entity_name} Type`}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${entity_name} type`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hotelTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.category_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Search Counter */}
                  <FormField
                    control={form.control}
                    name="_tracking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
                              setTracking(checked ? 1 : 0)
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Add Search Counter</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Short Description */}
                <FormField
                  control={form.control}
                  name="desc_short"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Short Description"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Long Description */}
              <FormField
                control={form.control}
                name="desc_long"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Long Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Long Description"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Filters Table */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Filters</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filter Name</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filters.map(filter => (
                      <TableRow key={filter.id}>
                        <TableCell className="font-medium">{filter.name}</TableCell>
                        <TableCell>
                          {filter.name.includes('Distance') ? (
                            <RadioGroup
                              value={selectedFilterId}
                              onValueChange={() => onRadioBtnSelection(filter)}
                              className="flex"
                            >
                              <RadioGroupItem value={filter.id} />
                            </RadioGroup>
                          ) : (
                            <Checkbox
                              checked={filter.value === '1'}
                              onCheckedChange={() => onChangeCheckbox(filter)}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-full md:w-1/3"
                  disabled={!isFormValid() || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </div>
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}