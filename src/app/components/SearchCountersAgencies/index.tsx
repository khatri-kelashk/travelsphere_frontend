'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoaderIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';

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
import {API_URL} from '../../../constants';
import {getHeadersForHttpReq} from '../../../constants/token';

const comp_route = 'api/agencies';
const entity_name = 'Agency';

interface Agency {
  id: string;
  name: string;
  location: string;
  phone_no: string;
  working_hours: string;
  desc_long: string;
  search_counter: number;
}

export default function SearchCountersAgencies() {
  const [data, setData] = useState<Agency[]>([]);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("ascend");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [searchValues, setSearchValues] = useState({
    name: '',
    location: '',
    phone_no: '',
    working_hours: '',
    desc_long: '',
  });
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [recordToReset, setRecordToReset] = useState<Agency | null>(null);

  const compareByAlph = (a: string, b: string): number => {
    if (a > b) return -1;
    if (a < b) return 1;
    return 0;
  };

  const fetchData = async (params: any = {}) => {
    try {
      setLoading(true);
      const headers = getHeadersForHttpReq();
      const page = params.page ? params.page - 1 : pagination.current - 1;
      const sortOrderParam = sortOrder === 'ascend' ? 'ASC' : 'DESC';

      const requestData = {
        _tracking: '1',
        name: searchValues.name,
        location: searchValues.location,
        phone_no: searchValues.phone_no,
        working_hours: searchValues.working_hours,
        desc_long: searchValues.desc_long,
        page,
        sortColumn: sortField,
        sortOrder: sortOrderParam,
        size: pagination.pageSize,
        orderBy: ''
      };

      const response = await axios.post(`${API_URL}${comp_route}/pagination_table`, requestData, { headers });

      setPagination(prev => ({
        ...prev,
        total: response.data.totalElements,
        current: page + 1,
      }));
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      toast.error('Failed to fetch agencies data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (field: keyof typeof searchValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValues(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, sortField, sortOrder, searchValues]);

  const resetCounter = async () => {
    if (!recordToReset) return;
    
    try {
      setLoading(true);
      setLoadingMessage('Resetting counter, please wait...');
      const headers = getHeadersForHttpReq();

      const response = await axios.get(`${API_URL}${comp_route}/reset_count_qwt/${recordToReset.id}`, { headers });
      
      if (response.data.success) {
        toast.success('Counter reset successfully');
        fetchData();
      } else {
        toast.error(response.data.message || 'Failed to reset counter');
      }
    } catch (error) {
      console.error('Error resetting counter:', error);
      toast.error('System is unable to reset the counter');
    } finally {
      setLoading(false);
      setResetDialogOpen(false);
    }
  };

  const handleSort = (column: string) => {
    const newSortOrder = sortField === column ? 
      (sortOrder === 'ascend' ? 'descend' : 'ascend') : 'ascend';
    setSortField(column);
    setSortOrder(newSortOrder);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, current: newPage }));
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[15.5%] text-center">Search Counter</TableHead>
            
            <TableHead className="w-[15.5%]" onClick={() => handleSort('name')}>
              <div className="flex items-center">
                <span>{entity_name} Name</span>
                <Input
                  placeholder={`${entity_name} Name`}
                  value={searchValues.name}
                  onChange={handleSearchChange('name')}
                  className="ml-2"
                  icon={<SearchIcon className="h-4 w-4" />}
                />
              </div>
            </TableHead>
            
            <TableHead className="w-[15.5%]" onClick={() => handleSort('location')}>
              <div className="flex items-center">
                <span>Location</span>
                <Input
                  placeholder="Location"
                  value={searchValues.location}
                  onChange={handleSearchChange('location')}
                  className="ml-2"
                  icon={<SearchIcon className="h-4 w-4" />}
                />
              </div>
            </TableHead>
            
            <TableHead className="w-[15.5%]" onClick={() => handleSort('phone_no')}>
              <div className="flex items-center">
                <span>Phone No#</span>
                <Input
                  placeholder="Phone No#"
                  value={searchValues.phone_no}
                  onChange={handleSearchChange('phone_no')}
                  className="ml-2"
                  icon={<SearchIcon className="h-4 w-4" />}
                />
              </div>
            </TableHead>
            
            <TableHead className="w-[15.5%]" onClick={() => handleSort('working_hours')}>
              <div className="flex items-center">
                <span>Working Hours</span>
                <Input
                  placeholder="Working Hours"
                  value={searchValues.working_hours}
                  onChange={handleSearchChange('working_hours')}
                  className="ml-2"
                  icon={<SearchIcon className="h-4 w-4" />}
                />
              </div>
            </TableHead>
            
            <TableHead className="w-[15.5%]" onClick={() => handleSort('desc_long')}>
              <div className="flex items-center">
                <span>Description</span>
                <Input
                  placeholder="Description"
                  value={searchValues.desc_long}
                  onChange={handleSearchChange('desc_long')}
                  className="ml-2"
                  icon={<SearchIcon className="h-4 w-4" />}
                />
              </div>
            </TableHead>
            
            <TableHead className="w-[7%]">Reset</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((agency) => (
            <TableRow key={agency.id}>
              <TableCell className="text-center">{agency.search_counter}</TableCell>
              <TableCell>{agency.name}</TableCell>
              <TableCell>{agency.location}</TableCell>
              <TableCell>{agency.phone_no}</TableCell>
              <TableCell>{agency.working_hours}</TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="truncate max-w-[150px]">{agency.desc_long}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{agency.desc_long}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <Button
                  variant="link"
                  className="text-red-500"
                  onClick={() => {
                    setRecordToReset(agency);
                    setResetDialogOpen(true);
                  }}
                >
                  Reset
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {data.length} of {pagination.total} records
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            disabled={pagination.current === 1}
            onClick={() => handlePageChange(pagination.current - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
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

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will reset the search counter for this agency.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetCounter}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}