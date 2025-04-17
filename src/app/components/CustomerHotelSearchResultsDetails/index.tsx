'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LoaderIcon } from "lucide-react";
import { API_URL } from '../../../constants';
import { getHeadersForHttpReq } from '../../../constants/token';
import dummy from '../images/dummy.png';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';

const comp_route = 'api/residencies';
const img_route = 'api/images';
const gallery_images_route = 'api/gallery_images';
const entity_name = 'Hotel';

const formSchema = z.object({
  name: z.string().optional(),
  country_id: z.string().min(1, "Please select a Country!"),
  region_id: z.string().optional(),
  resd_type_id: z.string().optional(),
  distance_name: z.string().optional(),
});

interface Category {
  id: string;
  category_name: string;
}

interface Filter {
  id: string;
  name: string;
}

interface GalleryImage {
  id: string;
  name: string;
  image_id: string;
}

interface HotelDetails {
  id: string;
  name: string;
  country_name: string;
  region_name: string;
  agency_name: string;
  agency_id: string;
  desc_short: string;
  desc_long: string;
  resd_image_id: string;
  price_image_id: string;
  logo_id: string;
  phone_no: string;
  location: string;
  working_hours: string;
  ag_desc_long: string;
}

export default function CustomerHotelSearchResultsDetails() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [hotelData, setHotelData] = useState<HotelDetails | null>(null);
  const [countries, setCountries] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Category[]>([]);
  const [hotelTypes, setHotelTypes] = useState<Category[]>([]);
  const [distances, setDistances] = useState<Filter[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [filters2, setFilters2] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      country_id: '',
      region_id: '',
      resd_type_id: '',
      distance_name: '',
    },
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        const searchData = localStorage.getItem('search_data');
        const hotelDetails = localStorage.getItem('search_res_details');

        if (searchData && hotelDetails) {
          const data = JSON.parse(searchData);
          const hotel = JSON.parse(hotelDetails);

          form.reset({
            name: data.name || '',
            country_id: data.country_id || '',
            region_id: data.region_id || '',
            resd_type_id: data.resd_type_id || '',
            distance_name: data.distance_name || '',
          });

          setSelectedFilters(data.selectedFilters ? JSON.parse(data.selectedFilters) : []);
          setHotelData(hotel);
          
          // Fetch additional data
          const headers = getHeadersForHttpReq();
          await Promise.all([
            getAvailableFilters(headers),
            getCategoriesByType('COUNTRY', headers),
            getCategoriesByType('REGION', headers),
            getCategoriesByType('HOTEL TYPE', headers),
            fetchGalleryImages(hotel.id, headers),
          ]);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [form]);

  const getAvailableFilters = async (headers: any) => {
    try {
      const response = await axios.get(`${API_URL}api/filters/all_avble_filters`, { headers });
      const output_data = response.data.data;
      
      const ds: Filter[] = [];
      const fs2: string[] = [];
      
      output_data.forEach((item: Filter) => {
        if (item.name.includes('Distance')) {
          ds.push(item);
        } else {
          fs2.push(item.name);
        }
      });
      
      setFilters2(fs2);
      setDistances(ds);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const getCategoriesByType = async (category_type: string, headers: any) => {
    try {
      const response = await axios.get(
        `${API_URL}api/categories/get_constants_by_type/${category_type}`,
        { headers }
      );
      
      switch (category_type) {
        case 'COUNTRY':
          setCountries(response.data.data);
          break;
        case 'REGION':
          setRegions(response.data.data);
          break;
        case 'HOTEL TYPE':
          setHotelTypes(response.data.data);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${category_type}:`, error);
    }
  };

  const fetchGalleryImages = async (hotelId: string, headers: any) => {
    try {
      const data = {
        resd_id: hotelId,
        euro_trip_id: '',
        name: '',
      };

      const response = await axios.get(`${API_URL}${gallery_images_route}/gallery_images_by_entity`, {
        headers,
        params: { data: JSON.stringify(data) }
      });

      setGalleryImages(response.data.data);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    }
  };

  const updateSearchCounter = (record: { id: string }, search_route: string) => {
    if (record.id) {
      const headers = getHeadersForHttpReq();
      axios.get(`${API_URL}api/${search_route}/update_counter/${record.id}`, { headers })
        .catch(err => console.log('Error occurred while updating counter:', err));
    }
  };

  const navigateAgencyProfile = (hotel_record: HotelDetails) => {
    const record = {
      id: hotel_record.agency_id,
      name: hotel_record.agency_name,
      desc_long: hotel_record.ag_desc_long,
      location: hotel_record.location,
      logo_id: hotel_record.logo_id,
      phone_no: hotel_record.phone_no,
      working_hours: hotel_record.working_hours
    };
    updateSearchCounter(record, 'agencies');
    localStorage.setItem('agency_details', JSON.stringify(record));
    router.push('/dashboard/agency_profile');
  };

  const handleViewImage = (imageId: string) => {
    if (imageId !== '00000000-0000-00') {
      window.open(`${API_URL}${img_route}/${imageId}`);
    }
  };

  const handleDisplayImageModal = (image: GalleryImage) => {
    if (image.image_id !== '00000000-0000-00') {
      setSelectedImageUrl(`${API_URL}${img_route}/${image.image_id}`);
      setIsImageModalOpen(true);
    }
  };

  const splitHours = (hours: string) => {
    if (!hours) return null;
    return hours.split(/\r?\n/).map((item, index) => (
      <p key={`h${index}u`} className="text-sm">{item}</p>
    ));
  };

  const agencyPopoverContent = (record: HotelDetails) => {
    const img_url = record.logo_id !== '00000000-0000-00' 
      ? `${API_URL}${img_route}/${record.logo_id}`
      : dummy;

    return (
      <div className="grid grid-cols-4 gap-4 p-2">
        <div className="col-span-1">
          <Image 
            src={img_url} 
            alt="Agency Logo" 
            width={150}
            height={150}
            className="w-full h-[150px] object-cover"
          />
        </div>
        <div className="col-span-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Agency Name:</div>
            <div>{record.agency_name}</div>
            
            <div className="font-medium">Phone No#:</div>
            <div>{record.phone_no}</div>
            
            <div className="font-medium">Location:</div>
            <div>{record.location}</div>
            
            <div className="font-medium">Working Hours:</div>
            <div>{splitHours(record.working_hours)}</div>
          </div>
        </div>
      </div>
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setLoadingMessage(`Searching ${entity_name}s, please wait...`);
      
      const data = {
        name: values.name,
        country_id: values.country_id,
        region_id: values.region_id,
        resd_type_id: values.resd_type_id,
        distance_name: values.distance_name,
        selectedFilters: JSON.stringify(selectedFilters),
        page: 0,
        sortColumn: 'name',
        sortOrder: 'ASC',
        size: 5,
      };
      
      const headers = getHeadersForHttpReq();
      const response = await axios.post(
        `${API_URL}${comp_route}/search_pagination_table`,
        data,
        { headers }
      );
      
      if (response.data.success) {
        localStorage.setItem('search_res', JSON.stringify(response.data.data));
        localStorage.setItem('search_data', JSON.stringify(data));
        router.push('/dashboard/search_results');
      }
    } catch (error) {
      console.error(`Error occurred while searching ${entity_name}s:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (selected: string[]) => {
    setSelectedFilters(selected);
    setIndeterminate(!!selected.length && selected.length < filters2.length);
    setCheckAll(selected.length === filters2.length);
  };

  const handleCheckAllChange = (checked: boolean) => {
    setSelectedFilters(checked ? filters2 : []);
    setIndeterminate(false);
    setCheckAll(checked);
  };

  if (!hotelData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hotelImageUrl = hotelData.resd_image_id !== '00000000-0000-00'
    ? `${API_URL}${img_route}/${hotelData.resd_image_id}`
    : dummy;

  const priceListImageUrl = hotelData.price_image_id !== '00000000-0000-00'
    ? `${API_URL}${img_route}/${hotelData.price_image_id}`
    : dummy;

  return (
    <div className="relative">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <LoaderIcon className="h-8 w-8 animate-spin text-white" />
            <p className="text-white mt-2">{loadingMessage}</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6">Hotel Details</h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search Form */}
          <div className="lg:col-span-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <FormField
                  control={form.control}
                  name="country_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{`${entity_name} Country`}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`${entity_name} Country`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((cy) => (
                            <SelectItem key={cy.id} value={cy.id}>
                              {cy.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{`${entity_name} Region`}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`${entity_name} Region`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resd_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{`${entity_name} Type`}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`${entity_name} Type`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hotelTypes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="distance_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beach Distance</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Beach Distance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {distances.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Filters</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="checkAll"
                      checked={checkAll}
                      onCheckedChange={(checked) => handleCheckAllChange(checked as boolean)}
                    />
                    <label htmlFor="checkAll" className="text-sm font-medium leading-none">
                      Check all
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filters2.map((filter) => (
                      <div key={filter} className="flex items-center space-x-2">
                        <Checkbox
                          id={filter}
                          checked={selectedFilters.includes(filter)}
                          onCheckedChange={(checked) => {
                            const newSelected = checked
                              ? [...selectedFilters, filter]
                              : selectedFilters.filter((f) => f !== filter);
                            handleFilterChange(newSelected);
                          }}
                        />
                        <label htmlFor={filter} className="text-sm font-medium leading-none">
                          {filter}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full mt-4">
                  Search
                </Button>
              </form>
            </Form>
          </div>

          {/* Hotel Details */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                <div className="md:col-span-1">
                  <Image
                    src={hotelImageUrl}
                    alt={hotelData.name}
                    width={200}
                    height={200}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="md:col-span-3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Hotel Name:</p>
                      <p>{hotelData.name}</p>
                    </div>
                    <div>
                      <p className="font-medium">Country:</p>
                      <p>{hotelData.country_name}</p>
                    </div>
                    <div>
                      <p className="font-medium">Region:</p>
                      <p>{hotelData.region_name}</p>
                    </div>
                    <div>
                      <p className="font-medium">Agency:</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-left"
                            onClick={() => navigateAgencyProfile(hotelData!)}
                          >
                            {hotelData.agency_name}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[600px]">
                          {agencyPopoverContent(hotelData)}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="col-span-2">
                      <p className="font-medium">Short Description:</p>
                      <p>{hotelData.desc_short}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gallery Images */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Other Images</h3>
              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {galleryImages.map((image) => (
                    <Card key={image.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-2">
                        <Image
                          src={`${API_URL}${img_route}/${image.image_id}`}
                          alt={image.name}
                          width={200}
                          height={150}
                          className="w-full h-[150px] object-cover rounded-t-lg"
                        />
                        <Button 
                          onClick={() => handleDisplayImageModal(image)}
                          className="w-full mt-2"
                        >
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No gallery images available
                </div>
              )}
            </div>

            {/* Price List */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Pricelist</h3>
              <Image
                src={priceListImageUrl}
                alt="Price List"
                width={800}
                height={600}
                className="w-full h-auto border rounded-lg"
              />
            </div>

            {/* Long Description */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Long Description</h3>
              <p className="whitespace-pre-line">{hotelData.desc_long}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{entity_name} Image</DialogTitle>
          </DialogHeader>
          <Image
            src={selectedImageUrl || dummy}
            alt="Selected Image"
            width={800}
            height={600}
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}