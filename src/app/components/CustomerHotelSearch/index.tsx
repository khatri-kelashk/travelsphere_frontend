'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LoaderIcon } from "lucide-react";

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
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { API_URL } from '../../../constants';
import { getHeadersForHttpReq } from '../../../constants/token';

const comp_route = 'api/residencies';
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

interface Agency {
  id: string;
  name: string;
}

interface EuroTrip {
  id: string;
  country_name: string;
  detail_records: {
    id: string;
    name: string;
    transportation_type: string;
    no_of_days: string;
  }[];
}

export default function CustomerHotelSearch() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [countries, setCountries] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Category[]>([]);
  const [hotelTypes, setHotelTypes] = useState<Category[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [eurotrips, setEurotrips] = useState<EuroTrip[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filters2, setFilters2] = useState<string[]>([]);
  const [distances, setDistances] = useState<Filter[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState(false);
  const [checkAll, setCheckAll] = useState(false);
  const [size] = useState(5);

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

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const headers = getHeadersForHttpReq();
        
        await Promise.all([
          getAvailableFilters(headers),
          getAgencies(headers),
          getEuroTrips(headers),
          getCategoriesByType('COUNTRY', 'countries', headers),
          getCategoriesByType('REGION', 'regions', headers),
          getCategoriesByType('HOTEL TYPE', 'hotel_types', headers),
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const getAvailableFilters = async (headers: any) => {
    try {
      const response = await axios.get(`${API_URL}api/filters/all_avble_filters`, { headers });
      const output_data = response.data.data;
      
      const ds: Filter[] = [];
      const fs: Filter[] = [];
      const fs2: string[] = [];
      
      output_data.forEach((item: Filter) => {
        if (item.name.includes('Distance')) {
          ds.push(item);
        } else {
          fs.push(item);
          fs2.push(item.name);
        }
      });
      
      setFilters(fs);
      setFilters2(fs2);
      setDistances(ds);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const getAgencies = async (headers: any) => {
    try {
      const response = await axios.get(`${API_URL}api/agencies/all_agencies`, { headers });
      setAgencies(response.data.data);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const getCategoriesByType = async (category_type: string, data_key: string, headers: any) => {
    try {
      const response = await axios.get(
        `${API_URL}api/categories/get_constants_by_type/${category_type}`,
        { headers }
      );
      
      switch (data_key) {
        case 'countries':
          setCountries(response.data.data);
          break;
        case 'regions':
          setRegions(response.data.data);
          break;
        case 'hotel_types':
          setHotelTypes(response.data.data);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${category_type}:`, error);
    }
  };

  const getEuroTrips = async (headers: any) => {
    try {
      const response = await axios.get(`${API_URL}api/euro_trips/all_eurotrips`, { headers });
      setEurotrips(response.data.data);
    } catch (error) {
      console.error('Error fetching eurotrips:', error);
    }
  };

  const navigateAgencyProfile = (record: Agency) => {
    updateSearchCounter(record, 'agencies');
    localStorage.setItem('agency_details', JSON.stringify(record));
    router.push('/dashboard/agency_profile');
  };

  const navigateEuroTripProfile = (record: any) => {
    updateSearchCounter(record, 'euro_trips');
    localStorage.setItem('eurotrip_details', JSON.stringify(record));
    router.push('/dashboard/eurotrip_profile');
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setLoadingMessage(`Searching ${entity_name} record, please wait...`);
      
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
        size: size,
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
          pageSize: size,
        }));
        localStorage.setItem('search_data', JSON.stringify(data));
        router.push('/dashboard/search_results');
      } else {
        console.error('System failed to find the Hotels!');
      }
    } catch (error) {
      console.error(`Error occurred while searching ${entity_name}:`, error);
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

      <div className="grid grid-cols-24 gap-4 mt-12">
        <div className="col-span-1"></div>
        <div className="col-span-22">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-24 gap-4">
                <div className="col-span-4">
                  <h2 className="text-2xl font-bold">{`Search ${entity_name}`}</h2>
                </div>
                <div className="col-span-20">
                  <div className="grid grid-cols-24 gap-4">
                    <div className="col-span-8">
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
                    </div>
                    <div className="col-span-8">
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
                    </div>
                    <div className="col-span-8">
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
                    </div>
                  </div>

                  <div className="grid grid-cols-24 gap-4 mt-4">
                    <div className="col-span-8">
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
                    </div>
                    <div className="col-span-8">
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
                    </div>
                    <div className="col-span-8">
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
                    </div>
                  </div>

                  <div className="grid grid-cols-24 gap-4 mt-8">
                    <div className="col-span-9"></div>
                    <div className="col-span-6">
                      <Button type="submit" className="w-full">
                        Search
                      </Button>
                    </div>
                    <div className="col-span-9"></div>
                  </div>
                </div>
              </div>
            </form>
          </Form>

          <div className="grid grid-cols-24 gap-4 mt-8">
            <div className="col-span-12">
              <Card>
                <CardHeader>
                  <CardTitle>LIST OF AGENCIES</CardTitle>
                </CardHeader>
                <CardContent>
                  {agencies.length > 0 ? (
                    <ul className="space-y-2">
                      {agencies.map((item, index) => (
                        <li key={`a${index}g`}>
                          <button
                            onClick={() => navigateAgencyProfile(item)}
                            className="text-blue-600 hover:underline"
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-gray-500 py-4">No agencies found</div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="col-span-12">
              <Card>
                <CardHeader>
                  <CardTitle>LIST OF EUROTRIPS</CardTitle>
                </CardHeader>
                <CardContent>
                  {eurotrips.length > 0 ? (
                    <ul className="space-y-4">
                      {eurotrips.map((item, index) => (
                        <li key={`e${index}u`}>
                          <p className="font-medium">{item.country_name}</p>
                          <ul className="ml-4 space-y-2">
                            {item.detail_records.map((item2, index2) => (
                              <li key={`eucr${index2}de`}>
                                <button
                                  onClick={() => navigateEuroTripProfile(item2)}
                                  className="text-blue-600 hover:underline"
                                >
                                  {`${item2.name} | ${item2.transportation_type} | ${item2.no_of_days}`}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-gray-500 py-4">No eurotrips found</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}