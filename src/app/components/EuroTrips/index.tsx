'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LoaderIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { API_URL } from '../../../constants';
import { getHeadersForHttpReq } from '../../../constants/token';

const comp_route = 'api/euro_trips';
const entity_name = 'Euro Trip';

interface EuroTrip {
  id: string;
  name: string;
  country_name: string;
  no_of_days: string;
  transportation_type: string;
  desc_short: string;
  desc_long: string;
}

interface SearchValues {
  name: string;
  country_name: string;
  no_of_days: string;
  transportation_type: string;
  desc_short: string;
  desc_long: string;
}

interface Pagination {
  current?: number;
  pageSize?: number;
  total?: number;
}

export default function EuroTrips() {
  const router = useRouter();
  const [data, setData] = useState<EuroTrip[]>([]);
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("ascend");
  const [pagination, setPagination] = useState<Pagination>({});
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(5);
  const [searchValues, setSearchValues] = useState<SearchValues>({
    name: '',
    country_name: '',
    no_of_days: '',
    transportation_type: '',
    desc_short: '',
    desc_long: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(`Adding ${entity_name} record, please wait...`);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<EuroTrip | null>(null);

  const compareByAlph = (a: string, b: string): number => {
    if (a > b) { return -1; }
    if (a < b) { return 1; }
    return 0;
  };

  const handleEditRecord = (record: EuroTrip) => {
    localStorage.setItem('updEurotrip', JSON.stringify(record));
    router.push('/dashboard/update_euro_trip');
  };

  const handleChangeSearchValues = (prop: keyof SearchValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValues(prev => ({
      ...prev,
      [prop]: e.target.value
    }));
  };

  useEffect(() => {
    fetchData();
  }, [searchValues]);

  const fetchData = async (params: any = {}) => {
    setLoading(true);
    const headers = getHeadersForHttpReq();

    let pageNumber = params.page ? params.page - 1 : 0;
    let sortOrderParam = 'ASC';
    
    if (params.sortOrder === 'ascend') { 
      sortOrderParam = 'ASC';
      setSortOrder('ascend');
    } else if (params.sortOrder === 'descend') { 
      sortOrderParam = 'DESC';
      setSortOrder('descend');
    } else { 
      sortOrderParam = 'ASC';
      setSortOrder('ascend');
    }

    if (params.sortField) {
      setSortField(params.sortField);
    }
    
    const data = {
      name: searchValues.name || '',
      country_name: searchValues.country_name || '',
      no_of_days: searchValues.no_of_days || '', 
      transportation_type: searchValues.transportation_type || '',
      desc_short: searchValues.desc_short || '',
      desc_long: searchValues.desc_long || '',
      
      page: pageNumber,
      sortColumn: params.sortField || sortField,
      sortOrder: sortOrderParam,
      size: size,
      orderBy: ''
    };
    
    try {
      const response = await axios.post(`${API_URL}${comp_route}/pagination_table`, data, { headers });
      
      const newPagination = {
        ...pagination,
        total: response.data.totalElements,
        current: pageNumber + 1,
        pageSize: size
      };
      
      setPagination(newPagination);
      setData(response.data.data);
    } catch (err) {
      console.error('Error occurred while fetching Euro trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async () => {
    if (!recordToDelete) return;
    
    setLoading(true);
    setLoadingMessage('System is deleting record, please wait...');
    const headers = getHeadersForHttpReq();

    try {
      const res = await axios.delete(`${API_URL}${comp_route}/${recordToDelete.id}`, { headers });
      if (res.data.success) {
        fetchData();
        setRecordToDelete(null);
      }
    } catch (err) {
      console.error(`Error occurred while deleting the ${entity_name}:`, err);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSort = (column: string) => {
    const newSortOrder = sortField === column ? (sortOrder === 'ascend' ? 'descend' : 'ascend') : 'ascend';
    setSortField(column);
    setSortOrder(newSortOrder);
    fetchData({
      sortField: column,
      sortOrder: newSortOrder,
      page: pagination.current
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData({ page: newPage });
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
        <div className="col-span-18">
          <h2 className="text-2xl font-bold">{`${entity_name}s`}</h2>
        </div>
        <div className="col-span-4">
          <Link href="/dashboard/add_euro_trip">
            <Button variant="outline" className="w-full">
              <span>+ </span> Add {entity_name}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-24 gap-4 mt-2">
        <div className="col-span-1"></div>
        <div className="col-span-22">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('name')}>
                  <div>Name</div>
                  <Input
                    placeholder="Name"
                    value={searchValues.name}
                    onChange={handleChangeSearchValues('name')}
                    className="mt-1"
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('country_name')}>
                  <div>Country</div>
                  <Input
                    placeholder="Country"
                    value={searchValues.country_name}
                    onChange={handleChangeSearchValues('country_name')}
                    className="mt-1"
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('transportation_type')}>
                  <div>Transportation Type</div>
                  <Input
                    placeholder="Transportation Type"
                    value={searchValues.transportation_type}
                    onChange={handleChangeSearchValues('transportation_type')}
                    className="mt-1"
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('no_of_days')}>
                  <div>No# of Days</div>
                  <Input
                    placeholder="No# of Days"
                    value={searchValues.no_of_days}
                    onChange={handleChangeSearchValues('no_of_days')}
                    className="mt-1"
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('desc_short')}>
                  <div>Short Description</div>
                  <Input
                    placeholder="Short Description"
                    value={searchValues.desc_short}
                    onChange={handleChangeSearchValues('desc_short')}
                    className="mt-1"
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('desc_long')}>
                  <div>Long Description</div>
                  <Input
                    placeholder="Long Description"
                    value={searchValues.desc_long}
                    onChange={handleChangeSearchValues('desc_long')}
                    className="mt-1"
                  />
                </TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.name}</TableCell>
                  <TableCell>{record.country_name}</TableCell>
                  <TableCell>{record.transportation_type}</TableCell>
                  <TableCell>{record.no_of_days}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="truncate max-w-[150px]">{record.desc_short}</div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{record.desc_short}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="truncate max-w-[150px]">{record.desc_long}</div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{record.desc_long}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Button variant="link" onClick={() => handleEditRecord(record)}>
                      Edit
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="text-red-500"
                      onClick={() => {
                        setRecordToDelete(record);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <span className="mx-4 flex items-center">
              Page {page} of {Math.ceil((pagination.total || 0) / size)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil((pagination.total || 0) / size)}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {entity_name.toLowerCase()} record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteRecord}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}