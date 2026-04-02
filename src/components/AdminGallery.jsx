/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  X,
  FolderPlus,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listGalleries,
  listGalleryCategories,
  createGalleryImage,
  updateGallery,
  deleteGallery,
  createGalleryCategory
} from "@/api/adminClient";

export default function AdminGallery() {
  const [activeTab, setActiveTab] = useState("images");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
const [categoryName, setCategoryName] = useState("");
  const [imageForm, setImageForm] = useState({
    title: "",
    image_url: "",
    category: "",
    description: "",
    is_featured: false,
    order: 0,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    cover_image: "",
    order: 0,
  });

  const queryClient = useQueryClient();

  const { data: images = [] } = useQuery({
    queryKey: ["galleryImages"],
    queryFn: () => listGalleries(),
  });

 const { data: categories = [] } = useQuery({
  queryKey: ["galleryCategories"],
  queryFn: listGalleryCategories,
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
});

  const createImageMutation = useMutation({
    mutationFn: (data) => createGalleryImage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] });
      closeImageModal();
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const galleryId = id.includes("-") ? id.split("-")[0] : id;
      return updateGallery(galleryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] });
      closeImageModal();
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id) => {
      const galleryId = id.includes("-") ? id.split("-")[0] : id;
      return deleteGallery(galleryId);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] }),
  });

const createCategoryMutation = useMutation({
  mutationFn: createGalleryCategory,
  onSuccess: () => {
    queryClient.invalidateQueries(['galleryCategories']);

    setCategoryForm({ name: "", slug: "" }); // clear form
    setIsCategoryModalOpen(false); // close modal
  },
});


  const deleteCategoryMutation = useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["galleryCategories"] }),
  });

const openImageModal = () => {
  setImageForm({
    image_url: "",
    title: "",
    category:
      selectedCategory !== "all"
        ? selectedCategory
        : categories[0]?.slug || "",
    is_featured: false,
  });

  setIsImageModalOpen(true);
};

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setEditingImage(null);
  };

const handleImageUpload = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  // ✅ 1. File size validation (IMPORTANT)
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (file.size > maxSize) {
    alert("Image too large! Max size is 5MB.");
    return;
  }

  // ✅ 2. File type validation (optional but good)
  if (!file.type.startsWith("image/")) {
    alert("Only image files are allowed");
    return;
  }

  // ✅ 3. Preview
  const imageUrl = URL.createObjectURL(file);

  setImageForm((prev) => ({
    ...prev,
    image_url: imageUrl,
    imageFile: file, // 🔥 important for upload
  }));
};

  const handleMultipleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        await createGalleryImage({
          title: file.name.split(".")[0],
          category:
            selectedCategory === "all"
              ? categories[0]?.slug || categories[0] || "general"
              : selectedCategory,
          imageFile: file,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] });
    } finally {
      setUploading(false);
    }
  };

  const handleImageSubmit = (e) => {
    e.preventDefault();
    const payload = { ...imageForm, imageFile: imageFile || undefined };
    if (editingImage) {
      updateImageMutation.mutate({ id: editingImage.id, data: payload });
    } else {
      createImageMutation.mutate(payload);
    }
  };

const handleCategorySubmit = (e) => {
  e.preventDefault();

  const name = categoryForm.name;

  if (!name.trim()) return;

  createCategoryMutation.mutate(name);
};

const normalize = (str) => str?.trim().toLowerCase();

const filteredImages =
  selectedCategory === "all"
    ? images
    : images.filter(
        (img) => normalize(img.category) === normalize(selectedCategory)
      );

  return (
    <div title="Gallery Management">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === "images" ? (
              <>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Bulk Upload</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleMultipleUpload}
                    disabled={uploading}
                  />
                </label>
                <Button
                  onClick={() => openImageModal()}
                  className="bg-[#1E3A8A] hover:bg-[#1E40AF]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-[#1E3A8A] hover:bg-[#1E40AF]"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="images">
          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === "all"
                  ? "bg-[#1E3A8A] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({images.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug.trim().toLowerCase())}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat.slug
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.name} (
                {images.filter((i) => i.category === cat.slug).length})
              </button>
            ))}
          </div>

          {/* Images Grid */}
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-blue-700">Uploading images...</span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100"
              >
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => openImageModal(image)}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteImageMutation.mutate(image.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {image.is_featured && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-[#FACC15] text-[#1E3A8A] text-xs font-semibold rounded">
                    Featured
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient from-black/80 to-transparent">
                  <p className="text-white text-sm font-medium truncate">
                    {image.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No images in this category</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="aspect-video bg-gray-100">
                  {category.cover_image ? (
                    <img
                      src={category.cover_image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FolderPlus className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">/{category.slug}</p>
                </div>
                <button
                  onClick={() => deleteCategoryMutation.mutate(category.id)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No categories yet</p>
              <Button
                onClick={() => setIsCategoryModalOpen(true)}
                variant="outline"
              >
                Create Your First Category
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingImage ? "Edit Image" : "Add New Image"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleImageSubmit} className="space-y-4">
            <div>
              <Label>Image</Label>
              {imageForm.image_url ? (
                <div className="relative mt-2 rounded-lg overflow-hidden">
                  <img
                    src={imageForm.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImageForm((prev) => ({ ...prev, image_url: "" }))
                    }
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#1E3A8A] mt-2">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Click to upload</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e)}
                  />
                </label>
              )}
            </div>

            <div>
              <Label>Title</Label>
              <Input
                value={imageForm.title}
                onChange={(e) =>
                  setImageForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Image title"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={imageForm.category}
                onValueChange={(v) =>
                  setImageForm((prev) => ({ ...prev, category: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label>Featured</Label>
              <Switch
                checked={imageForm.is_featured}
                onCheckedChange={(checked) =>
                  setImageForm((prev) => ({ ...prev, is_featured: checked }))
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeImageModal}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#1E3A8A] hover:bg-[#1E40AF]">
                {editingImage ? "Update" : "Add"} Image
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
     <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Add Category</DialogTitle>
    </DialogHeader>

    {/* ✅ FORM SUBMIT HANDLE */}
    <form onSubmit={handleCategorySubmit} className="space-y-4">
      
      <div>
        <Label>Category Name</Label>
        <Input
          value={categoryForm.name}
          onChange={(e) =>
            setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., Annual Function"
          className="mt-1"
        />
      </div>

      <div>
        <Label>Slug (optional)</Label>
        <Input
          value={categoryForm.slug}
          onChange={(e) =>
            setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))
          }
          placeholder="auto-generated from name"
          className="mt-1"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCategoryModalOpen(false)}
        >
          Cancel
        </Button>

        {/* ✅ FIXED BUTTON */}
        <Button type="submit">
          Create Category
        </Button>
      </div>

    </form>
  </DialogContent>
</Dialog>
    </div>
  );
}
