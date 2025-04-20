'use client'

import React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SearchCountersAgencies from '../SearchCountersAgencies';
import SearchCountersCategories from '../SearchCountersCategories';
import SearchCountersEurotrips from '../SearchCountersEurotrips';
import SearchCountersResidences from '../SearchCountersResidences';

const SearchCounters = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Search Counters</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="agencies" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="agencies">Agencies</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="eurotrips">Eurotrips</TabsTrigger>
              <TabsTrigger value="hotels">Hotels</TabsTrigger>
            </TabsList>
            
            <TabsContent value="agencies">
              <SearchCountersAgencies />
            </TabsContent>
            
            <TabsContent value="categories">
              <SearchCountersCategories />
            </TabsContent>
            
            <TabsContent value="eurotrips">
              <SearchCountersEurotrips />
            </TabsContent>
            
            <TabsContent value="hotels">
              <SearchCountersResidences />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchCounters;