import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import VenueCard from '../components/VenueCard';
import { apiFetch, endpoints } from '../services/api';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import type { Venue } from '../context/AppContext';

type StatusFilter = 'all' | 'free' | 'reserved' | 'occupied';

export default function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchVenues = async () => {
    try {
      const data = await apiFetch<Venue[]>(endpoints.venues.list);
      setVenues(data);
    } catch (error) {
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();

    // Poll every 30s so venue statuses update when sessions start/end
    const interval = setInterval(fetchVenues, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = venues.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.building.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (v as any).status === statusFilter;
    const matchCapacity = capacityFilter === 'all' ||
      (capacityFilter === 'small' && v.capacity <= 40) ||
      (capacityFilter === 'medium' && v.capacity > 40 && v.capacity <= 80) ||
      (capacityFilter === 'large' && v.capacity > 80);
    return matchSearch && matchStatus && matchCapacity;
  });

  const statusCounts = {
    all: venues.length,
    free: venues.filter(v => (v as any).status === 'free').length,
    reserved: venues.filter(v => (v as any).status === 'reserved').length,
    occupied: venues.filter(v => (v as any).status === 'occupied').length,
  };

  return (
    <Layout>
      <div className="max-7xl mx-auto">
        <PageHeader
          title="Venue Finder"
          subtitle="Find and explore available venues across campus"
        />

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(['all', 'free', 'reserved', 'occupied'] as StatusFilter[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                statusFilter === status
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-500/40'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search venues, buildings…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 bg-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
              showFilters ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border border-gray-100 p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800 text-sm">Filter by Capacity</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All Sizes' },
                { value: 'small', label: 'Small (≤40)' },
                { value: 'medium', label: 'Medium (41–80)' },
                { value: 'large', label: 'Large (80+)' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCapacityFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    capacityFilter === opt.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Search size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No venues found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((venue, i) => (
              <VenueCard key={venue.id} venue={venue} index={i} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}