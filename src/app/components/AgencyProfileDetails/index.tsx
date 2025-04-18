'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LoaderIcon } from 'lucide-react';
import {API_URL} from '../../../constants';
import dummy from '../images/dummy.png';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const img_route = 'api/images';
const entity_name = 'Agency';

interface AgencyDetails {
  id: string;
  name: string;
  phone_no: string;
  location: string;
  working_hours: string;
  desc_long: string;
  logo_id: string;
}

export default function AgencyProfileDetails() {
  const router = useRouter();
  const [agency, setAgency] = useState<AgencyDetails | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('System is Loading..Please wait..');

  useEffect(() => {
    const loadAgencyData = () => {
      try {
        const agencyData = localStorage.getItem('agency_details');
        if (!agencyData) {
          router.push('/dashboard/search_hotels');
          return;
        }

        const parsedData: AgencyDetails = JSON.parse(agencyData);
        let imgUrl = '';
        
        if (parsedData.logo_id !== '00000000-0000-00') {
          imgUrl = `${API_URL}${img_route}/${parsedData.logo_id}`;
        }

        setAgency(parsedData);
        setImageUrl(imgUrl);
      } catch (error) {
        console.error('Error loading agency data:', error);
        router.push('/dashboard/search_hotels');
      } finally {
        setLoading(false);
      }
    };

    loadAgencyData();
  }, [router]);

  const splitHours = (hours: string) => {
    if (!hours) return null;
    return hours.split(/\r?\n/).map((item, index) => (
      <p key={`h${index}u`} className="text-sm">{item}</p>
    ));
  };

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

  if (!agency) {
    return null; // or redirect handling
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{`${entity_name} Details`}</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <div className="relative aspect-square">
                <Image
                  src={imageUrl || dummy}
                  alt={agency.name}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Agency Name:</p>
                  <p>{agency.name}</p>
                </div>
                
                <div>
                  <p className="font-medium">Phone No#:</p>
                  <p>{agency.phone_no}</p>
                </div>
                
                <div>
                  <p className="font-medium">Location:</p>
                  <p>{agency.location}</p>
                </div>
                
                <div>
                  <p className="font-medium">Working Hours:</p>
                  <div>{splitHours(agency.working_hours)}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Long Description</h3>
            <p className="whitespace-pre-line">{agency.desc_long}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}