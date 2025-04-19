'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LoaderIcon } from 'lucide-react';
import Image from 'next/image';
import {API_URL} from '../../../constants';
import {getHeadersForHttpReq} from '../../../constants/token';
import dummy from '../images/dummy.png';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const img_route = 'api/images';
const gallery_images_route = 'api/gallery_images';
const entity_name = 'Eurotrip';

interface EurotripDetails {
  id: string;
  name: string;
  country_name: string;
  transportation_type: string;
  no_of_days: string;
  agency_name: string;
  agency_id: string;
  desc_short: string;
  desc_long: string;
  image_id: string;
  price_image_id: string;
  ag_desc_long: string;
  location: string;
  logo_id: string;
  phone_no: string;
  working_hours: string;
}

interface GalleryImage {
  id: string;
  name: string;
  image_id: string;
}

export default function EurotripProfileDetails() {
  const router = useRouter();
  const [eurotripData, setEurotripData] = useState<EurotripDetails | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('System is Loading..Please wait..');

  useEffect(() => {
    const loadEurotripData = async () => {
      try {
        const eurotripDetails = localStorage.getItem('eurotrip_details');
        if (!eurotripDetails) {
          router.push('/dashboard/search_hotels');
          return;
        }

        const parsedData: EurotripDetails = JSON.parse(eurotripDetails);
        setEurotripData(parsedData);
        
        // Fetch gallery images
        const headers = getHeadersForHttpReq();
        const data = {
          resd_id: '',
          euro_trip_id: parsedData.id,
          name: ''
        };

        const response = await axios.get(`${API_URL}${gallery_images_route}/gallery_images_by_entity`, {
          headers,
          params: { data: JSON.stringify(data) }
        });

        setGalleryImages(response.data.data);
      } catch (error) {
        console.error('Error loading eurotrip data:', error);
        router.push('/dashboard/search_hotels');
      } finally {
        setLoading(false);
      }
    };

    loadEurotripData();
  }, [router]);

  const navigateAgencyProfile = (hotel_record: EurotripDetails) => {
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

  const updateSearchCounter = (record: { id: string }, search_route: string) => {
    if (record.id) {
      const headers = getHeadersForHttpReq();
      axios.get(`${API_URL}api/${search_route}/update_counter/${record.id}`, { headers })
        .catch(err => console.log('Error occurred while updating counter:', err));
    }
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

  if (!eurotripData) {
    return null; // or redirect handling
  }

  const mainImageUrl = eurotripData.image_id !== '00000000-0000-00'
    ? `${API_URL}${img_route}/${eurotripData.image_id}`
    : dummy;

  const priceListImageUrl = eurotripData.price_image_id !== '00000000-0000-00'
    ? `${API_URL}${img_route}/${eurotripData.price_image_id}`
    : dummy;

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{`${entity_name} Details`}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Eurotrip Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <div className="relative aspect-square">
                <Image
                  src={mainImageUrl}
                  alt={eurotripData.name}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            </div>

            <div className="md:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Euro Trip Name:</p>
                  <p>{eurotripData.name}</p>
                </div>

                <div>
                  <p className="font-medium">Country:</p>
                  <p>{eurotripData.country_name}</p>
                </div>

                <div>
                  <p className="font-medium">Transportation Type:</p>
                  <p>{eurotripData.transportation_type}</p>
                </div>

                <div>
                  <p className="font-medium">No# of Days:</p>
                  <p>{eurotripData.no_of_days}</p>
                </div>

                <div>
                  <p className="font-medium">Agency:</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-left"
                    onClick={() => navigateAgencyProfile(eurotripData)}
                  >
                    {eurotripData.agency_name}
                  </Button>
                </div>

                <div className="col-span-2">
                  <p className="font-medium">Short Description:</p>
                  <p>{eurotripData.desc_short}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Gallery Images */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Other Images</h3>
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryImages.map((image) => (
                  <Card key={image.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-2">
                      <div className="relative aspect-square">
                        <Image
                          src={`${API_URL}${img_route}/${image.image_id}`}
                          alt={image.name}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
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

          <Separator />

          {/* Price List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pricelist</h3>
            <div className="border rounded-lg overflow-hidden">
              <Image
                src={priceListImageUrl}
                alt="Price List"
                width={800}
                height={600}
                className="w-full h-auto"
              />
            </div>
          </div>

          <Separator />

          {/* Long Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Long Description</h3>
            <p className="whitespace-pre-line">{eurotripData.desc_long}</p>
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Eurotrip Image</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-square">
            <Image
              src={selectedImageUrl || dummy}
              alt="Selected Image"
              fill
              className="rounded-lg object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}