'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { API_URL } from '../../../constants'
import { getHeadersForHttpReq } from '../../../constants/token'
import { LoaderIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner";
import Image from 'next/image'

const comp_route = 'api/residencies'
const img_route = 'api/images'
const gallery_images_route = 'api/gallery_images'
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

interface GalleryImage {
  id: string
  image_id: string
  name: string
  resd_image_id?: string
}

interface OtherImage {
  id: string
  image_id: string
  name: string
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

export default function Residences() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [countries, setCountries] = useState<Country[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [filters, setFilters] = useState<Filter[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [hotelTypes, setHotelTypes] = useState<HotelType[]>([])
  const [selectedFilterId, setSelectedFilterId] = useState<string>('')
  const [tracking, setTracking] = useState<number>(0)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [otherImages, setOtherImages] = useState<OtherImage[]>([])
  const [selectedOtherImages, setSelectedOtherImages] = useState<OtherImage[]>([])
  const [mainImage, setMainImage] = useState<string>('')
  const [priceListImage, setPriceListImage] = useState<string>('')
  const [galleryImage, setGalleryImage] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 3,
    total: 0
  })
  const [searchValues, setSearchValues] = useState({
    name: ''
  })
  const [hotelData, setHotelData] = useState<any>({})

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
        const storedHotel = localStorage.getItem('updHotel')
        if (!storedHotel) {
          router.push('/dashboard/hotels')
          return
        }

        const hotelObj = JSON.parse(storedHotel)
        setHotelData(hotelObj)
        
        setIsLoading(true)
        await Promise.all([
          getAvailableFilters(),
          getAgencies(),
          getCategoriesByType('COUNTRY', setCountries),
          getCategoriesByType('REGION', setRegions),
          getCategoriesByType('HOTEL TYPE', setHotelTypes),
          fetchResidencePricelistImages(),
          fetchOtherImages(),
          getResidenceFilters(hotelObj.id)
        ])

        // Set form values
        form.reset({
          name: hotelObj.name,
          country_id: hotelObj.country_id,
          region_id: hotelObj.region_id,
          agency_id: hotelObj.agency_id,
          resd_type_id: hotelObj.resd_type_id,
          desc_short: hotelObj.desc_short,
          desc_long: hotelObj.desc_long,
          _tracking: hotelObj._tracking === 1
        })

        // Set images
        if (hotelObj.resd_image_id !== '00000000-0000-00') {
          setMainImage(`${API_URL}${img_route}/${hotelObj.resd_image_id}`)
        }
        if (hotelObj.price_image_id !== '00000000-0000-00') {
          setPriceListImage(`${API_URL}${img_route}/${hotelObj.price_image_id}`)
        }

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

  const getResidenceFilters = async (id: string) => {
    if (!id) return
    
    const headers = getHeadersForHttpReq()
    try {
      const response = await axios.get(`${API_URL}api/resd_filters/byID/${id}`, { headers })
      const filters = response.data.data
      const distanceFilter = filters.find((f: Filter) => f.value === 1 && f.name.includes('Distance'))
      setFilters(filters)
      setSelectedFilterId(distanceFilter?.id || '')
    } catch (error) {
      console.error('Error fetching hotel filters:', error)
      throw error
    }
  }

  const fetchResidencePricelistImages = async (params: any = {}) => {
    if (!hotelData.id) return

    const headers = getHeadersForHttpReq()
    try {
      const page = params.page ? params.page - 1 : 0
      const sortOrder = params.sortOrder === 'descend' ? 'DESC' : 'ASC'

      const data = {
        resd_id: hotelData.id,
        euro_trip_id: '',
        name: searchValues.name || '',
        page,
        sortColumn: params.sortField || 'name',
        sortOrder,
        size: pagination.pageSize,
        orderBy: '',
      }

      const response = await axios.post(
        `${API_URL}${gallery_images_route}/pagination_table`,
        data,
        { headers }
      )

      setGalleryImages(response.data.data)
      setPagination({
        ...pagination,
        total: response.data.totalElements,
        current: page + 1
      })
    } catch (error) {
      console.error('Error fetching gallery images:', error)
      throw error
    }
  }

  const fetchOtherImages = async () => {
    if (!hotelData.id) return

    const headers = getHeadersForHttpReq()
    try {
      const data = { resd_id: hotelData.id }
      const response = await axios.post(
        `${API_URL}${gallery_images_route}/other_images`,
        data,
        { headers }
      )
      setOtherImages(response.data.data)
    } catch (error) {
      console.error('Error fetching other images:', error)
      throw error
    }
  }

  const deleteImage = async (record: GalleryImage) => {
    try {
      setIsLoading(true)
      setLoadingMessage('Deleting image, please wait...')
      
      const headers = getHeadersForHttpReq()
      const response = await axios.delete(
        `${API_URL}${gallery_images_route}/${record.id}/${record.image_id}`,
        { headers }
      )

      if (response.data.success) {
        await Promise.all([
          fetchResidencePricelistImages(),
          fetchOtherImages()
        ])
        // toast({
        //   title: 'Success',
        //   description: 'Image deleted successfully!'
        // })
      } else {
        // toast({
        //   variant: 'destructive',
        //   title: 'Error',
        //   description: response.data.message
        // })
      }
    } catch (error) {
      console.error('Error deleting image:', error)
    //   toast({
    //     variant: 'destructive',
    //     title: 'Error',
    //     description: 'System is unable to delete the image!'
    //   })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewImage = (record: GalleryImage | OtherImage) => {
    if (record.image_id !== '00000000-0000-00') {
      window.open(`${API_URL}${img_route}/${record.image_id}`)
    } else {
      // toast({
      //   variant: 'destructive',
      //   title: 'Error',
      //   description: 'Image not found!'
      // })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, route: string, imgOpt: string) => {
    if (!e.target.files || e.target.files.length === 0) return

    try {
      setIsLoading(true)
      setLoadingMessage(`Uploading ${entity_name} image, please wait...`)

      const headers = {
        Authorization: `${localStorage.getItem('tokenType')} ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }

      if (imgOpt !== '-1') {
        const file = e.target.files[0]
        const fileName = file.name
        const extension = fileName.substring(fileName.lastIndexOf('.') + 1)

        if (file.size > 1024 * 1024 * 4 || !/png|jpe?g/i.test(extension)) {
          // toast({
          //   variant: 'destructive',
          //   title: 'Error',
          //   description: 'Please upload a valid image (JPEG/PNG, max 4MB)'
          // })
          return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('resd_id', hotelData.id)
        formData.append('euro_trip_id', '00000000-0000-00')

        if (imgOpt === '1') {
          formData.append('img_key', 'resd_image_id')
        } else if (imgOpt === '2') {
          formData.append('img_key', 'price_image_id')
        }

        const response = await axios.post(
          `${API_URL}${img_route}/${route}/addImage`,
          formData,
          { headers }
        )

        // Refresh data
        const updatedHotel = await axios.get(
          `${API_URL}${comp_route}/byID/${hotelData.id}`,
          { headers }
        )
        
        setHotelData(updatedHotel.data.data[0])
        
        if (imgOpt === '1') {
          setMainImage(`${API_URL}${img_route}/${updatedHotel.data.data[0].resd_image_id}`)
        } else if (imgOpt === '2') {
          setPriceListImage(`${API_URL}${img_route}/${updatedHotel.data.data[0].price_image_id}`)
        }

        // toast({
        //   title: 'Success',
        //   description: `${entity_name} image uploaded successfully!`
        // })
      } else {
        // Multiple files upload for gallery
        const files = Array.from(e.target.files)
        for (const file of files) {
          const fileName = file.name
          const extension = fileName.substring(fileName.lastIndexOf('.') + 1)

          if (file.size > 1024 * 1024 * 4 || !/png|jpe?g/i.test(extension)) {
            // toast({
            //   variant: 'destructive',
            //   title: 'Error',
            //   description: `Skipping ${fileName} - invalid format or size`
            // })
            continue
          }

          const formData = new FormData()
          formData.append('file', file)
          formData.append('resd_id', hotelData.id)
          formData.append('euro_trip_id', '00000000-0000-00')

          await axios.post(
            `${API_URL}${img_route}/${route}/addImage`,
            formData,
            { headers }
          )
        }

        // Refresh gallery images
        await fetchResidencePricelistImages()
        // toast({
        //   title: 'Success',
        //   description: 'Gallery images uploaded successfully!'
        // })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      // toast({
      //   variant: 'destructive',
      //   title: 'Error',
      //   description: 'Failed to upload image'
      // })
    } finally {
      setIsLoading(false)
    }
  }

  const uploadSelectedImagesAsGalleryOtherImages = async () => {
    if (selectedOtherImages.length === 0) return

    try {
      setIsLoading(true)
      setLoadingMessage('Adding selected images as gallery images, please wait...')
      
      const headers = getHeadersForHttpReq()
      const data = {
        resd_id: hotelData.id,
        imgs: JSON.stringify(selectedOtherImages.map(img => img.image_id))
      }

      const response = await axios.post(
        `${API_URL}${gallery_images_route}/add_otherImages`,
        data,
        { headers }
      )

      if (response.data.success) {
        await Promise.all([
          fetchResidencePricelistImages(),
          fetchOtherImages()
        ])
        setIsModalOpen(false)
        setSelectedOtherImages([])
        // toast({
        //   title: 'Success',
        //   description: 'Selected images added to gallery successfully!'
        // })
      } else {
        // toast({
        //   variant: 'destructive',
        //   title: 'Error',
        //   description: response.data.message
        // })
      }
    } catch (error) {
      console.error('Error adding gallery images:', error)
      // toast({
      //   variant: 'destructive',
      //   title: 'Error',
      //   description: 'Failed to add selected images to gallery'
      // })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      setLoadingMessage(`Updating ${entity_name}, please wait...`)
      
      const data = {
        id: hotelData.id,
        _tracking: values._tracking ? 1 : 0,
        name: values.name,
        country_id: values.country_id,
        region_id: values.region_id,
        agency_id: values.agency_id,
        resd_type_id: values.resd_type_id,
        desc_short: values.desc_short,
        desc_long: values.desc_long,
        filters: JSON.stringify(filters)
      }

      const headers = getHeadersForHttpReq()
      const response = await axios.put(`${API_URL}${comp_route}/update`, data, { headers })

      if (response.data.success) {
        // Refresh hotel data
        const updatedResponse = await axios.get(
          `${API_URL}${comp_route}/byID/${hotelData.id}`,
          { headers }
        )
        setHotelData(updatedResponse.data.data[0])
        await getResidenceFilters(hotelData.id)

        // toast({
        //   title: 'Success',
        //   description: `${entity_name} updated successfully!`
        // })
      } else {
        // toast({
        //   variant: 'destructive',
        //   title: 'Error',
        //   description: response.data.message
        // })
      }
    } catch (error) {
      console.error(`Error updating ${entity_name}:`, error)
      // toast({
      //   variant: 'destructive',
      //   title: 'Error',
      //   description: `Failed to update ${entity_name}`
      // })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter handlers
  const onChangeCheckbox = (record: Filter) => {
    const updatedFilters = filters.map(filter => {
      if (filter.id === record.id) {
        // For distance filters, first reset all distance values
        if (filter.name.includes('Distance')) {
          return {
            ...filter,
            value: filter.value === '0' ? '1' : '0'
          }
        }
        return {
          ...filter,
          value: filter.value === '0' ? '1' : '0'
        }
      }
      return filter
    })

    // If this was a distance filter, make sure only one is selected
    if (record.name.includes('Distance')) {
      const distanceFilters = updatedFilters.filter(f => f.name.includes('Distance'))
      if (distanceFilters.some(f => f.value === '1')) {
        setSelectedFilterId(record.id)
      } else {
        setSelectedFilterId('')
      }
    }

    setFilters(updatedFilters)
  }

  const onRadioBtnSelection = (record: Filter) => {
    setSelectedFilterId(record.id)
    onChangeCheckbox(record)
  }

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Images */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">{`Update ${entity_name}`}</h2>
                
                {/* Main Image */}
                <div className="space-y-2">
                  <FormLabel>{`${entity_name} Main Image`}</FormLabel>
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {mainImage ? (
                      <Image
                        src={mainImage}
                        alt="Main hotel image"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleImageUpload(e, 'resd_img', '1')}
                  />
                </div>

                {/* Gallery Other Upload */}
                <div className="space-y-2">
                  <FormLabel>{`${entity_name} Gallery Other Upload`}</FormLabel>
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {galleryImage ? (
                      <Image
                        src={galleryImage}
                        alt="Gallery image"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleImageUpload(e, 'gallery_img', '-1')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Select From Uploaded Images
                  </Button>
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
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

                {/* Agency and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
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
                    
                    {/* Search Counter */}
                    <FormField
                      control={form.control}
                      name="_tracking"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Add Search Counter</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Hotel Type and Short Description */}
                  <div className="space-y-4">
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
                  </div>
                </div>

                {/* Pricelist Image */}
                <div className="space-y-2">
                  <FormLabel>{`${entity_name} Pricelist Image Upload`}</FormLabel>
                  <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    {priceListImage ? (
                      <Image
                        src={priceListImage}
                        alt="Pricelist image"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleImageUpload(e, 'resd_img', '2')}
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

                {/* Gallery Images Table */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Other Gallery Images</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image Name</TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead>View</TableHead>
                          <TableHead>Delete</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {galleryImages.map((image) => (
                          <TableRow key={image.id}>
                            <TableCell className="font-medium">{image.name}</TableCell>
                            <TableCell>
                              <div className="w-20 h-20 relative">
                                <Image
                                  src={`${API_URL}${img_route}/${image.image_id}`}
                                  alt={image.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="link"
                                onClick={() => handleViewImage(image)}
                              >
                                View
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="link"
                                className="text-red-500"
                                onClick={() => deleteImage(image)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Hotel Filters */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Hotel Filters</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filter Name</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filters.map((filter) => (
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
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    type="submit"
                    className="w-full md:w-1/2"
                    disabled={!isFormValid() || isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </div>
                    ) : (
                      'Update'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      )}

      {/* Modal for selecting other images */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Images</DialogTitle>
          </DialogHeader>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>View</TableHead>
                  <TableHead>Select</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherImages.map((image) => (
                  <TableRow key={image.id}>
                    <TableCell className="font-medium">
                      {image.name || '--'}
                    </TableCell>
                    <TableCell>
                      <div className="w-20 h-20 relative">
                        <Image
                          src={`${API_URL}${img_route}/${image.image_id}`}
                          alt={image.name || 'Other image'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        onClick={() => handleViewImage(image)}
                      >
                        View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selectedOtherImages.some(
                          (selected) => selected.id === image.id
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOtherImages([...selectedOtherImages, image])
                          } else {
                            setSelectedOtherImages(
                              selectedOtherImages.filter(
                                (selected) => selected.id !== image.id
                              )
                            )
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              disabled={selectedOtherImages.length === 0}
              onClick={uploadSelectedImagesAsGalleryOtherImages}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              ) : (
                `Upload Selected (${selectedOtherImages.length})`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}