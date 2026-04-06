/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Bell, Star, FileText, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { listNotices } from '@/api/adminClient';

export default function Notices() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => listNotices(),
  });

  const defaultNotices = [
    {
      id: 1,
      title: 'Admissions Open for 2026-27',
      description: 'We are now accepting applications for the academic year 2026-27. Limited seats available for all classes from Nursery to Class 12. Apply now to secure your child\'s future.',
      date: '2026-03-01',
      is_highlighted: true,
    },
    {
      id: 2,
      title: 'Annual Function on 15 March',
      description: 'Join us for our grand annual function. Parents are cordially invited to attend. The event will feature cultural performances, prize distribution, and more.',
      date: '2026-03-15',
      is_highlighted: false,
    },
    {
      id: 3,
      title: 'Science Exhibition Registration Open',
      description: 'Students from Class 6 to Class 12 can register for the annual science exhibition. Last date for registration is March 10, 2026. Showcase your innovative projects!',
      date: '2026-03-05',
      is_highlighted: true,
    },
    {
      id: 4,
      title: 'Parent-Teacher Meeting',
      description: 'PTM scheduled for all classes. Parents are requested to attend to discuss their child\'s progress. Please check the schedule for your class.',
      date: '2026-02-28',
      is_highlighted: false,
    },
    {
      id: 5,
      title: 'Sports Day Announcement',
      description: 'Annual Sports Day will be held on March 20, 2026. Students participating in events should report to their respective houses by 7:30 AM.',
      date: '2026-03-20',
      is_highlighted: false,
    },
    {
      id: 6,
      title: 'Holiday Notice - Holi Festival',
      description: 'School will remain closed on March 25-26, 2026 on account of Holi festival. Classes will resume from March 27, 2026.',
      date: '2026-03-25',
      is_highlighted: false,
    },
  ];

  const liveNotices = notices.filter((notice) => notice.is_published !== false);
  const displayNotices = liveNotices.length > 0 ? liveNotices : defaultNotices;

  const filteredNotices = displayNotices.filter(notice =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero Banner */}
      <section className="relative h-[40vh] min-h-[300px] bg-[#1E3A8A] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=1920)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A]/80 to-transparent" />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-block px-4 py-2 bg-[#FACC15] text-[#1E3A8A] text-sm font-semibold rounded-full mb-4">
              Stay Updated
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-['Poppins']">
              News & Notices
            </h1>
            <p className="text-xl text-gray-200">
              Important announcements and updates
            </p>
          </motion.div>
        </div>
      </section>

      {/* Notices Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg rounded-full shadow-lg border-0"
              />
            </div>
          </motion.div>

          {/* Notices List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-[#1E3A8A] border-t-transparent rounded-full mx-auto" />
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notices found</p>
              </div>
            ) : (
              filteredNotices.map((notice, index) => (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group ${
                    notice.is_highlighted
                      ? 'border-l-4 border-l-[#FACC15]'
                      : 'border border-gray-100'
                  }`}
                >
                  {notice.is_highlighted && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#FACC15] rounded-full flex items-center justify-center shadow-lg">
                      <Star className="w-5 h-5 text-[#1E3A8A]" fill="currentColor" />
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Date Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-[#1E3A8A] rounded-xl flex flex-col items-center justify-center text-white">
                        <span className="text-3xl font-bold">
                          {format(new Date(notice.date), 'd')}
                        </span>
                        <span className="text-xs uppercase">
                          {format(new Date(notice.date), 'MMM yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#1E3A8A] transition-colors font-['Poppins']">
                        {notice.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {notice.description}
                      </p>

                      {notice.attachment_url && (
                        <a
                          href={notice.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 text-[#1E3A8A] font-semibold hover:underline"
                        >
                          <Download className="w-4 h-4" />
                          Download Attachment
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
