'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { toast } from 'sonner'
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
import { Skeleton } from "@/components/ui/skeleton"

const comp_route = 'api/euro_trips'
const entity_name = 'Euro Trip'

// Define TypeScript interfaces
interface Country {
  id: string
  category_name: string
}

interface TransportationType {
  id: string
  category_name: string
}

interface Agency {
  id: string
  name: string
}

interface NumberOption {
  id: number
  value: number
}

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(1, `${entity_name} name is required`),
  country_id: z.string().min(1, 'Country is required'),
  transportation_type_id: z.string().min(1, 'Transportation type is required'),
  agency_id: z.string().min(1, 'Agency is required'),
  no_of_days: z.number().min(1, 'Number of days is required'),
  desc_short: z.string().optional(),
  desc_long: z.string().optional(),
  _tracking: z.boolean().optional()
})

export default function EuroTripAdd() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [countries, setCountries] = useState<Country[]>([])
  const [transportationTypes, setTransportationTypes] = useState<TransportationType[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [numbers, setNumbers] = useState<NumberOption[]>([])
  const [tracking, setTracking] = useState<number>(0)

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      country_id: '',
      transportation_type_id: '',
      agency_id: '',
      no_of_days: 0,
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
          getEuroCountries('Europe'),
          getCategoriesByType('TRANSPORTATION TYPE'),
          getAgencies(),
          populateTwentyNumbers()
        ])
      } catch (error) {
        console.error('Error fetching initial data:', error)
        toast.error('Failed to load initial data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // API functions
  const getEuroCountries = async (parent_name: string) => {
    const headers = getHeadersForHttpReq()
    try {
      const response = await axios.get(`${API_URL}api/categories/get_by_parents/${parent_name}`, { headers })
      setCountries(response.data.data)
    } catch (error) {
      console.error('Error fetching countries:', error)
      throw error
    }
  }

  const getCategoriesByType = async (category_type: string) => {
    const headers = getHeadersForHttpReq()
    try {
      const response = await axios.get(`${API_URL}api/categories/get_constants_by_type/${category_type}`, { headers })
      setTransportationTypes(response.data.data)
    } catch (error) {
      console.error('Error fetching transportation types:', error)
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

  const populateTwentyNumbers = () => {
    const numbers = Array.from({ length: 21 }, (_, i) => ({ id: i, value: i }))
    setNumbers(numbers)
  }

  // Form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      setLoadingMessage(`Adding ${entity_name} record, please wait...`)
      
      const data = {
        name: values.name,
        country_id: values.country_id,
        transportation_type_id: values.transportation_type_id,
        agency_id: values.agency_id,
        no_of_days: values.no_of_days,
        desc_short: values.desc_short,
        desc_long: values.desc_long,
        _tracking: tracking,
      }

      const headers = getHeadersForHttpReq()
      const response = await axios.post(`${API_URL}${comp_route}/add`, data, { headers })

      if (response.data.success) {
        form.reset()
        setTracking(0)
        toast.success(`${entity_name} added successfully!`)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error(`Error adding ${entity_name}:`, error)
      toast.error(`System is unable to add the ${entity_name}!`)
    } finally {
      setIsLoading(false)
    }
  }

  // Form validation helpers
  const isFormValid = () => {
    return (
      form.getValues('name') &&
      form.getValues('country_id') &&
      form.getValues('transportation_type_id') &&
      form.getValues('agency_id') &&
      form.getValues('no_of_days')
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
          <Skeleton className="h-[125px] w-[250px] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{`Add ${entity_name}`}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Euro Trip Name */}
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
                            <SelectValue placeholder={`Select ${entity_name} country`} />
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
                
                {/* Transportation Type */}
                <FormField
                  control={form.control}
                  name="transportation_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transportation Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transportation type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {transportationTypes.map(type => (
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Number of Days */}
                <FormField
                  control={form.control}
                  name="no_of_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. of Days</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of days" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {numbers.map(num => (
                            <SelectItem key={num.id} value={num.value.toString()}>
                              {num.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Agency */}
                <FormField
                  control={form.control}
                  name="agency_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{`${entity_name} Agency`}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${entity_name} agency`} />
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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