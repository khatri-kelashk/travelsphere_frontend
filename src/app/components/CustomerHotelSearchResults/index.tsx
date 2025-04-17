'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LoaderIcon } from "lucide-react";
import { API_URL } from '../../../constants';
import { getHeadersForHttpReq } from '../../../constants/token';
let dummy: undefined = undefined /*from '../images/dummy.png'*/;

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const comp_route = 'api/residencies';
const img_route = 'api/images';
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

interface Hotel {
  id: string;
  name: string;
  country_name: string;
  region_name: string;
  agency_name: string;
  desc_short: string;
  resd_image_id: string;
  agency_id: string;
  logo_id: string;
  phone_no: string;
  location: string;
  working_hours: string;
}

export default function CustomerHotelSearchResults() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [countries, setCountries] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Category[]>([]);
  const [hotelTypes, setHotelTypes] = useState<Category[]>([]);
  const [distances, setDistances] = useState<Filter[]>([]);
  const [filters2, setFilters2] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

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

  // Initialize form with saved search data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const searchData = localStorage.getItem('search_data');
        const searchPag = localStorage.getItem('search_pag');
        const searchRes = localStorage.getItem('search_res');

        if (searchData && searchPag && searchRes) {
          const data = JSON.parse(searchData);
          const pag = JSON.parse(searchPag);
          const res = JSON.parse(searchRes);

          form.reset({
            name: data.name || '',
            country_id: data.country_id || '',
            region_id: data.region_id || '',
            resd_type_id: data.resd_type_id || '',
            distance_name: data.distance_name || '',
          });

          setSelectedFilters(data.selectedFilters ? JSON.parse(data.selectedFilters) : []);
          setPagination(pag);
          setHotels(res);
          
          // Fetch additional data
          const headers = getHeadersForHttpReq();
          await Promise.all([
            getAvailableFilters(headers),
            getCategoriesByType('COUNTRY', headers),
            getCategoriesByType('REGION', headers),
            getCategoriesByType('HOTEL TYPE', headers),
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

  const updateSearchCounter = (record: { id: string }, search_route: string) => {
    if (record.id) {
      const headers = getHeadersForHttpReq();
      axios.get(`${API_URL}api/${search_route}/update_counter/${record.id}`, { headers })
        .catch(err => console.log('Error occurred while updating counter:', err));
    }
  };

  const updateCategoriesSearchCounter = (data: any) => {
    const headers = getHeadersForHttpReq();
    axios.post(`${API_URL}${comp_route}/update_categories_counter`, data, { headers })
      .catch(err => console.log('Error occurred while updating counter:', err));
  };

  const navigateAgencyProfile = (hotel_record: Hotel) => {
    const record = {
      id: hotel_record.agency_id,
      name: hotel_record.agency_name,
      location: hotel_record.location,
      logo_id: hotel_record.logo_id,
      phone_no: hotel_record.phone_no,
      working_hours: hotel_record.working_hours
    };
    updateSearchCounter(record, 'agencies');
    localStorage.setItem('agency_details', JSON.stringify(record));
    router.push('/dashboard/agency_profile');
  };

  const handleViewDetails = (record: Hotel) => {
    updateSearchCounter(record, 'residencies');
    localStorage.setItem('search_res_details', JSON.stringify(record));
    router.push('/dashboard/search_result_details');
  };

  const splitHours = (hours: string) => {
    if (!hours) return null;
    return hours.split(/\r?\n/).map((item, index) => (
      <p key={`h${index}u`} className="text-sm">{item}</p>
    ));
  };

  const agencyPopoverContent = (record: Hotel) => {
    const img_url: any = record.logo_id !== '00000000-0000-00' 
      ? `${API_URL}${img_route}/${record.logo_id}`
      : dummy;

    return (
      <div className="grid grid-cols-4 gap-4 p-2">
        <div className="col-span-1">
          <img 
            src={img_url} 
            alt="Agency Logo" 
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
        size: pagination.pageSize,
      };
      
      const data2 = {
        country_id: values.country_id,
        region_id: values.region_id,
        resd_type_id: values.resd_type_id,
      };
      
      const headers = getHeadersForHttpReq();
      const response = await axios.post(
        `${API_URL}${comp_route}/search_pagination_table`,
        data,
        { headers }
      );
      
      if (response.data.success) {
        updateCategoriesSearchCounter(data2);
        localStorage.setItem('search_res', JSON.stringify(response.data.data));
        localStorage.setItem('search_pag', JSON.stringify({
          total: response.data.totalElements,
          current: 1,
          pageSize: pagination.pageSize,
        }));
        localStorage.setItem('search_data', JSON.stringify(data));
        
        setHotels(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.totalElements,
          current: 1,
        }));
      }
    } catch (error) {
      console.error(`Error occurred while searching ${entity_name}s:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, current: newPage }));
    // You may need to implement pagination fetch here
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

      <div className="grid grid-cols-24 gap-4 mt-4">
        <div className="col-span-1"></div>
        <div className="col-span-22">
          <h2 className="text-2xl font-bold">Hotels Found</h2>
        </div>
      </div>

      <div className="grid grid-cols-24 gap-4 mt-4">
        <div className="col-span-6 pr-4">
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

        <div className="col-span-17">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%] text-center">Image</TableHead>
                <TableHead className="w-[80%]">{entity_name} Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotels.map((hotel) => (
                <TableRow key={hotel.id}>
                  <TableCell className="text-center">
                    <div className="mx-auto w-[100px] h-[100px]">
                      <img
                        src={hotel.resd_image_id === '00000000-0000-00' 
                          ? dummy 
                          : `${API_URL}${img_route}/${hotel.resd_image_id}`}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <Button
                        variant="link"
                        onClick={() => handleViewDetails(hotel)}
                      >
                        See More Details..
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="font-medium">Hotel Name:</div>
                        <div>{hotel.name}</div>
                        
                        <div className="font-medium">Country:</div>
                        <div>{hotel.country_name}</div>
                        
                        <div className="font-medium">Region:</div>
                        <div>{hotel.region_name}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium">Agency:</div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-left"
                              onClick={() => navigateAgencyProfile(hotel)}
                            >
                              {hotel.agency_name}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[600px]">
                            {agencyPopoverContent(hotel)}
                          </PopoverContent>
                        </Popover>
                        
                        <div className="font-medium">Description:</div>
                        <div className="line-clamp-3">{hotel.desc_short}</div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              disabled={pagination.current === 1}
              onClick={() => handlePageChange(pagination.current - 1)}
            >
              Previous
            </Button>
            <span className="mx-4 flex items-center">
              Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <Button
              variant="outline"
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => handlePageChange(pagination.current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}