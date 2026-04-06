/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Star, StarOff, Eye, EyeOff, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  listNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from '@/api/adminClient';

export default function AdminNotices() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    is_highlighted: false,
    is_published: true,
    attachment_url: '',
  });

  const queryClient = useQueryClient();

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => listNotices(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => createNotice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateNotice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteNotice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notices'] }),
  });

  const openModal = (notice = null) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData({
        ...notice,
        date: notice.date ? format(new Date(notice.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      setEditingNotice(null);
      setFormData({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        is_highlighted: false,
        is_published: true,
        attachment_url: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNotice(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingNotice) {
      updateMutation.mutate({ id: editingNotice.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleHighlight = async (notice) => {
    updateMutation.mutate({
      id: notice.id,
      data: {
        title: notice.title,
        description: notice.description || '',
        date: notice.date ? format(new Date(notice.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        is_highlighted: !notice.is_highlighted,
        is_published: notice.is_published !== false,
        attachment_url: notice.attachment_url || '',
      },
    });
  };

  const togglePublish = async (notice) => {
    updateMutation.mutate({
      id: notice.id,
      data: {
        title: notice.title,
        description: notice.description || '',
        date: notice.date ? format(new Date(notice.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        is_highlighted: notice.is_highlighted === true,
        is_published: !notice.is_published,
        attachment_url: notice.attachment_url || '',
      },
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: upload attachment to backend when endpoint is available
  };

  return (
    <div title="Notice Management">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">Manage school notices and announcements</p>
        <Button onClick={() => openModal()} className="bg-[#1E3A8A] hover:bg-[#1E40AF]">
          <Plus className="w-4 h-4 mr-2" />
          Add Notice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Total Notices</p>
          <p className="text-2xl font-bold text-gray-900">{notices.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold text-green-600">
            {notices.filter(n => n.is_published).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Highlighted</p>
          <p className="text-2xl font-bold text-[#FACC15]">
            {notices.filter(n => n.is_highlighted).length}
          </p>
        </div>
      </div>

      {/* Notices List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#1E3A8A] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : notices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No notices yet</p>
            <Button onClick={() => openModal()} variant="outline">
              Add Your First Notice
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {notices.map((notice, index) => (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  notice.is_highlighted ? 'bg-[#FACC15]/5 border-l-4 border-l-[#FACC15]' : ''
                }`}
              >
                {/* Date Badge */}
                <div className="w-16 h-16 bg-[#1E3A8A] rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
                  <span className="text-xl font-bold">
                    {format(new Date(notice.date), 'd')}
                  </span>
                  <span className="text-xs">
                    {format(new Date(notice.date), 'MMM')}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{notice.title}</h3>
                    {notice.is_highlighted && (
                      <Star className="w-4 h-4 text-[#FACC15]" fill="currentColor" />
                    )}
                    {!notice.is_published && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{notice.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleHighlight(notice)}
                    className={`p-2 rounded-lg transition-colors ${
                      notice.is_highlighted
                        ? 'bg-[#FACC15]/20 text-[#FACC15]'
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title="Toggle highlight"
                  >
                    {notice.is_highlighted ? <Star className="w-4 h-4" fill="currentColor" /> : <StarOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => togglePublish(notice)}
                    className={`p-2 rounded-lg transition-colors ${
                      notice.is_published
                        ? 'bg-green-100 text-green-600'
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title="Toggle publish"
                  >
                    {notice.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openModal(notice)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(notice.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNotice ? 'Edit Notice' : 'Add New Notice'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notice title"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Notice content..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label>Date *</Label>
              <Input
                required
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Attachment (optional)</Label>
              <Input
                type="file"
                onChange={handleFileUpload}
                className="mt-1"
              />
              {formData.attachment_url && (
                <a href={formData.attachment_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                  View attached file
                </a>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label>Highlight Notice</Label>
                <p className="text-xs text-gray-500">Show as important</p>
              </div>
              <Switch
                checked={formData.is_highlighted}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_highlighted: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label>Publish</Label>
                <p className="text-xs text-gray-500">Make visible on website</p>
              </div>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1E3A8A] hover:bg-[#1E40AF]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingNotice ? 'Update' : 'Create'} Notice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
