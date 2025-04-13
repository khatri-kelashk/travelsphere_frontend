// app/agencies/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { LoaderIcon } from 'lucide-react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import axios from 'axios'
import { API_URL } from '../../../constants'
import { getHeadersForHttpReq } from '../../../constants/token'
import dummy_logo from '../../../images/logo.png'

const comp_route = 'api/agencies'
const img_route = 'api/images'
const entity_name = 'Agency'

type Agency = {
  id: string
  name: string
  location: string
  phone_no: string
  working_hours: string
  desc_long: string
  _tracking: number
  logo_id?: string
}

export default function AgenciesPage() {
  const [data, setData] = useState<Agency[]>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
    total: 0,
  })
  const [agency, setAgency] = useState<Agency | null>(null)
  const [searchValues, setSearchValues] = useState({
    name: '',
    location: '',
    phone_no: '',
    working_hours: '',
    desc_long: '',
  })
  const [flags, setFlags] = useState({
    f1: true,
    f2: true,
    f3: true,
    f4: true,
    f5: true,
    f6: true,
    f7: true,
    f8: true,
    f9: true,
    f10: true,
  })
  const [tracking, setTracking] = useState(0)
  const [image, setImage] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Table columns
  const columns: ColumnDef<Agency>[] = [
    {
      accessorKey: 'name',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>{`${entity_name} Name`}</span>
          <Input
            placeholder={`${entity_name} Name`}
            onChange={(e) => handleChangeSearchValues('name')(e)}
          />
        </div>
      ),
      cell: ({ row }) => <span className="text-sm">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'location',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>Location</span>
          <Input
            placeholder="Location"
            onChange={(e) => handleChangeSearchValues('location')(e)}
          />
        </div>
      ),
      cell: ({ row }) => <span className="text-sm">{row.getValue('location')}</span>,
    },
    {
      accessorKey: 'phone_no',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>Phone No#</span>
          <Input
            placeholder="Phone No#"
            onChange={(e) => handleChangeSearchValues('phone_no')(e)}
          />
        </div>
      ),
      cell: ({ row }) => <span className="text-sm">{row.getValue('phone_no')}</span>,
    },
    {
      accessorKey: 'working_hours',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>Working Hours</span>
          <Input
            placeholder="Working Hours"
            onChange={(e) => handleChangeSearchValues('working_hours')(e)}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {splitHours(row.getValue('working_hours'))}
        </div>
      ),
    },
    {
      accessorKey: 'desc_long',
      header: () => (
        <div className="flex flex-col space-y-2">
          <span>Description</span>
          <Input
            placeholder="Description"
            onChange={(e) => handleChangeSearchValues('desc_long')(e)}
          />
        </div>
      ),
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-sm truncate max-w-[150px]">
              {row.getValue('desc_long')}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {row.getValue('desc_long')}
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      id: 'edit',
      cell: ({ row }) => (
        <Button
          variant="link"
          onClick={() => handleEditRecord(row.original)}
        >
          Edit
        </Button>
      ),
    },
    {
      id: 'delete',
      cell: ({ row }) => (
        <Button
          variant="link"
          className="text-destructive"
          onClick={() => deleteAgency(row.original)}
        >
          Delete
        </Button>
      ),
    },
  ];

  
    // Table instance
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      manualPagination: true,
      rowCount: pagination.total,
      onPaginationChange: (updater) => {
        const newPagination = typeof updater === 'function' 
          ? updater(pagination) 
          : updater
        setPagination(newPagination)
        fetch({
          page: newPagination.pageIndex,
          size: newPagination.pageSize,
          sortField: sorting[0]?.id || 'name',
          sortOrder: sorting[0]?.desc ? 'DESC' : 'ASC',
          ...columnFilters,
        })
      },
      state: {
        sorting,
        columnFilters,
        pagination,
      },
    })

  // Helper function to split hours
  const splitHours = (hours: string) => {
    if (!hours) return null
    return hours.split(/\r?\n/).map((item, index) => (
      <p key={`h${index}`}>{item}</p>
    ))
  }

  // Business Logic Functions
  const handleEditRecord = (record: Agency) => {
    let imgUrl = ''
    if (record.logo_id && record.logo_id !== '00000000-0000-00') {
      imgUrl = `${API_URL}${img_route}/${record.logo_id}`
    }
    setAgency(record)
    setImage(imgUrl)
    setFlags({
      ...flags,
      f2: false,
      f4: false,
      f6: false,
      f8: false,
      f10: false,
    })
    setModalVisible(true)
  }

  const handleChangeSearchValues = (prop: keyof typeof searchValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValues = { ...searchValues, [prop]: e.target.value }
    setSearchValues(newSearchValues)
    fetch()
  }

  const deleteAgency = async (record: Agency) => {
    if (!confirm('Sure to delete?')) return
    
    setLoading(true)
    setLoadingMessage('System is deleting record, please wait...')
    const headers = getHeadersForHttpReq()

    try {
      const res = await axios.delete(`${API_URL}${comp_route}/${record.id}`, { headers })
      if (res.data.success) {
        fetch()
        setAgency(null)
        alert(`${entity_name} deleted successfully!`)
      } else {
        alert(res.data.message)
      }
    } catch (err) {
      console.log(`Error occurred while deleting the ${entity_name}:`, err)
      alert(`System is unable to delete the ${entity_name}!`)
    } finally {
      setLoading(false)
    }
  }

  const fetch = async (params: any = {}) => {
    setLoading(true)
    const headers = getHeadersForHttpReq()
    const page = params.page || 0
    const sortOrder = params.sortOrder === 'ascend' ? 'ASC' : 'DESC'

    const requestData = {
      name: searchValues.name,
      location: searchValues.location,
      phone_no: searchValues.phone_no,
      working_hours: searchValues.working_hours,
      desc_long: searchValues.desc_long,
      page,
      sortColumn: params.sortField || 'name',
      sortOrder,
      size: params.size || 5,
      orderBy: ''
    }

    try {
      const response = await axios.post(
        `${API_URL}${comp_route}/pagination_table`,
        requestData,
        { headers }
      )

      setData(response.data.data)
      setPagination({
        ...pagination,
        total: response.data.totalElements,
        pageIndex: page,
        pageSize: requestData.size
      })
    } catch (err) {
      console.log('Error fetching pagination data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const name = formData.get('name') as string
    const location = formData.get('location') as string
    const phone_no = formData.get('phone_no') as string
    const working_hours = formData.get('working_hours') as string
    const desc_long = formData.get('desc_long') as string

    if (!name || !location || !phone_no || !working_hours || !desc_long) {
      alert('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      setLoadingMessage(`Adding ${entity_name} record, please wait...`)
      const headers = getHeadersForHttpReq()

      const { data } = await axios.post(
        `${API_URL}${comp_route}/add`,
        {
          name,
          location,
          phone_no,
          working_hours,
          desc_long,
          _tracking: tracking
        },
        { headers }
      )

      if (data.success) {
        fetch()
        alert(`${entity_name} added successfully!`)
        // Reset form
        ;(e.target as HTMLFormElement).reset()
        setFlags(prev=>({
            ...prev,
          f1: true,
          f3: true,
          f5: true,
          f7: true,
          f9: true,
        }))
        setTracking(0)
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.log(`Error adding ${entity_name}:`, err)
      alert(`System is unable to add the ${entity_name}!`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agency) return

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const name = formData.get('name5') as string
    const location = formData.get('location5') as string
    const phone_no = formData.get('phone_no5') as string
    const working_hours = formData.get('working_hours5') as string
    const desc_long = formData.get('desc_long5') as string

    try {
      setLoading(true)
      setLoadingMessage(`System is updating ${entity_name} record, please wait...`)
      const headers = getHeadersForHttpReq()

      const { data } = await axios.put(
        `${API_URL}${comp_route}/update`,
        {
          id: agency.id,
          name,
          location,
          phone_no,
          working_hours,
          desc_long,
          _tracking: agency._tracking
        },
        { headers }
      )

      if (data.success) {
        fetch()
        setModalVisible(false)
        setAgency(null)
        alert(`${entity_name} updated successfully!`)
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.log(`Error updating ${entity_name}:`, err)
      alert(`System is unable to update the ${entity_name}!`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!agency || !e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    const fileName = file.name
    const extension = fileName.substring(fileName.lastIndexOf('.') + 1)

    if (file.size > 1024 * 1024 * 2 || !/png|jpe?g/i.test(extension)) {
      alert('Kindly upload correct image type as described (max 2MB)')
      return
    }

    try {
      setLoading(true)
      setLoadingMessage(`Uploading ${entity_name} Logo, please wait...`)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('agency_id', agency.id)

      const headers = {
        'Authorization': `${localStorage.getItem("tokenType")} ${localStorage.getItem("token")}`,
        'Content-Type': 'multipart/form-data'
      }

      const response = await axios.post(
        `${API_URL}api/images/agency_logo/addImage`,
        formData,
        { 
          headers,
          responseType: 'blob'
        }
      )

      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setLoading(false)
      }
      reader.readAsDataURL(response.data)
    } catch (err) {
      console.log(`Error uploading ${entity_name} logo:`, err)
      alert(`System is unable to upload the ${entity_name} Logo!`)
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, key: string) => {
    setFlags({ ...flags, [key]: e.target.value.length === 0 })
  }

  const handleSearchCounter = (checked: boolean) => {
    setTracking(checked ? 1 : 0)
  }

  const handleSearchCounterUpdate = (checked: boolean) => {
    if (!agency) return
    setAgency({ ...agency, _tracking: checked ? 1 : 0 })
  }

  // Initial fetch
  useEffect(() => {
    fetch()
  }, [])

  return (
    <div className="space-y-6 p-4">
      {loading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <LoaderIcon className="h-12 w-12 animate-spin" />
            <p className="text-lg">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Add Agency Form */}
      <Card>
        <CardHeader>
          <CardTitle>{`Add ${entity_name}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>{`${entity_name} Name`}</Label>
                  <Input
                    name="name"
                    placeholder={`${entity_name} Name`}
                    onChange={(e) => handleChange(e, 'f1')}
                  />
                </div>
                <div>
                  <Label>Phone No#</Label>
                  <Input
                    name="phone_no"
                    placeholder="Phone No#"
                    onChange={(e) => handleChange(e, 'f5')}
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <Checkbox
                    id="tracking"
                    checked={tracking === 1}
                    onCheckedChange={(checked) => handleSearchCounter(!!checked)}
                  />
                  <Label htmlFor="tracking">Add Search Counter</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Location</Label>
                  <Textarea
                    name="location"
                    placeholder="Location"
                    rows={3}
                    onChange={(e) => handleChange(e, 'f3')}
                  />
                </div>
                <div>
                  <Label>Working Hours</Label>
                  <Textarea
                    name="working_hours"
                    placeholder="Working Hours"
                    rows={3}
                    onChange={(e) => handleChange(e, 'f7')}
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  name="desc_long"
                  placeholder="Description"
                  rows={3}
                  onChange={(e) => handleChange(e, 'f9')}
                />
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={flags.f1 || flags.f3 || flags.f5 || flags.f7 || flags.f9}
                  className="w-full md:w-auto"
                >
                  Add
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Agencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agencies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-[90%]">
          <DialogHeader>
            <DialogTitle>{`Update ${entity_name}`}</DialogTitle>
          </DialogHeader>
          {agency && (
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
                    <Label>{`${entity_name} Logo`}</Label>
                    <img 
                      src={image || dummy_logo.src} 
                      alt="Agency Logo" 
                      className="w-full h-48 object-contain mb-4"
                    />
                    <Input 
                      type="file" 
                      id="file" 
                      onChange={handleLogoUpload} 
                      accept="image/png, image/jpeg, image/jpg"
                    />
                  </div>
                </div>
                <div>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <Label>{`${entity_name} Name`}</Label>
                        <Input
                          name="name5"
                          defaultValue={agency.name}
                          onChange={(e) => handleChange(e, 'f2')}
                        />
                      </div>
                      <div>
                        <Label>Phone No#</Label>
                        <Input
                          name="phone_no5"
                          defaultValue={agency.phone_no}
                          onChange={(e) => handleChange(e, 'f8')}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tracking-update"
                        checked={agency._tracking === 1}
                        onCheckedChange={(checked) => handleSearchCounterUpdate(!!checked)}
                      />
                      <Label htmlFor="tracking-update">Add Search Counter</Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Location</Label>
                        <Textarea
                          name="location5"
                          defaultValue={agency.location}
                          rows={3}
                          onChange={(e) => handleChange(e, 'f4')}
                        />
                      </div>
                      <div>
                        <Label>Working Hours</Label>
                        <Textarea
                          name="working_hours5"
                          defaultValue={agency.working_hours}
                          rows={3}
                          onChange={(e) => handleChange(e, 'f6')}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        name="desc_long5"
                        defaultValue={agency.desc_long}
                        rows={3}
                        onChange={(e) => handleChange(e, 'f10')}
                      />
                    </div>

                    <div className="flex justify-center">
                      <Button
                        type="submit"
                        disabled={flags.f2 || flags.f4 || flags.f6 || flags.f8 || flags.f10}
                        className="w-full md:w-1/3"
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}