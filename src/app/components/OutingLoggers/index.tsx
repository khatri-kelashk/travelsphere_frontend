'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LoaderIcon, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {API_URL} from '../../../constants';
import {getHeadersForHttpReq} from '../../../constants/token';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const comp_route = 'api/outing_loggers';

interface LoggerRecord {
  id: string;
  user_name: string;
  user_id: string;
  detail_records: {
    login_at: string;
    logout_at: string | null;
    time_difference: string;
  }[];
}

export default function OutingLoggers() {
  const [data, setData] = useState<LoggerRecord[]>([]);
  const [sortField, setSortField] = useState("user_name");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("ascend");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchValues, setSearchValues] = useState({
    user_name: '',
    login_at: '',
    logout_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [pagination.current, sortField, sortOrder, searchValues]);

  const fetchData = async (params: any = {}) => {
    try {
      const headers = getHeadersForHttpReq();
      const page = params.page ? params.page - 1 : pagination.current - 1;
      const sortOrderParam = sortOrder === 'ascend' ? 'ASC' : 'DESC';

      const requestData = {
        user_name: searchValues.user_name,
        login_at: searchValues.login_at,
        logout_at: searchValues.logout_at,
        page,
        sortColumn: sortField,
        sortOrder: sortOrderParam,
        size: pagination.pageSize,
        orderBy: ''
      };

      const response = await axios.post(`${API_URL}${comp_route}/pagination_table_upd`, requestData, { headers });

      setPagination(prev => ({
        ...prev,
        total: response.data.totalElements,
        current: page + 1,
      }));
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching logger data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValues(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
    }));
    setSortField(sorter.field);
    setSortOrder(sorter.order);
  };

  const calculateTotalTime = (detail_records: any[]) => {
    if (detail_records.length === 0) {
      return '0000-00-00 00:00:00';
    }

    if (detail_records.length === 1) {
      if (detail_records[0].time_difference) {
        return detail_records[0].logout_at 
          ? detail_records[0].time_difference 
          : 'Unknown';
      }
    }

    let t_h = 0, t_m = 0, t_s = 0;
    for (const record of detail_records) {
      if (record.logout_at) {
        const [hours, minutes, seconds] = record.time_difference.split(":").map(Number);
        t_h += hours;
        t_m += minutes;
        t_s += seconds;
      }
    }

    // Convert seconds to minutes
    t_m += Math.floor(t_s / 60);
    t_s = t_s % 60;

    // Convert minutes to hours
    t_h += Math.floor(t_m / 60);
    t_m = t_m % 60;

    // Format with leading zeros
    const formatTime = (num: number) => num.toString().padStart(2, '0');
    
    return `${formatTime(t_h)} hrs ${formatTime(t_m)} min ${formatTime(t_s)} sec`;
  };

  const isUserOnline = (detail_records: any[]) => {
    return detail_records.some(record => record.logout_at === null);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    try {
      return format(parseISO(dateString), 'dd-MMMM-yyyy hh:mm:ss a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const columns = [
    {
      accessorKey: "user_name",
      header: () => (
        <div className="flex items-center">
          <span>User Name</span>
          <Input
            placeholder="Search name"
            className="ml-2 w-48"
            value={searchValues.user_name}
            onChange={handleSearchChange("user_name")}
          />
        </div>
      ),
      cell: ({ row }: { row: any }) => (
        <span className="text-base">{row.original.user_name}</span>
      ),
    },
    {
      accessorKey: "total_time",
      header: "Total Time",
      cell: ({ row }: { row: any }) => (
        <span className="text-sm">
          {calculateTotalTime(row.original.detail_records)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <Badge variant={isUserOnline(row.original.detail_records) ? "success" : "destructive"}>
          {isUserOnline(row.original.detail_records) ? "Online" : "Offline"}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-white" />
          <p className="text-white mt-2">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Users Login Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column: any) => (
                  <TableHead key={column.accessorKey}>
                    {column?.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((logger) => (
                <React.Fragment key={logger.id}>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell key={`${logger.id}-${column.accessorKey}`}>
                        {column.cell({ row: { original: logger } })}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <div className="border rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 font-medium mb-2">
                          <div>Login At</div>
                          <div>Logout At</div>
                          <div>Session Time</div>
                        </div>
                        {logger.detail_records.map((record, index) => (
                          <div key={`${logger.id}-${index}`} className="grid grid-cols-3 gap-4 mb-2">
                            <div className="text-sm">
                              {formatDateTime(record.login_at)}
                            </div>
                            <div className="text-sm">
                              {formatDateTime(record.logout_at)}
                            </div>
                            <div className="text-sm">
                              {record.logout_at ? record.time_difference : '---'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
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
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={pagination.current * pagination.pageSize >= pagination.total}
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}