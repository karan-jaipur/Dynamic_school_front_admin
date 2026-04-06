import React, { useMemo, useRef, useState } from "react";
import { FolderPlus, Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createGalleryCategory,
  createGalleryImage,
  deleteGallery,
  listGalleries,
  listGalleryCategories,
} from "@/api/adminClient";

function categoryLabel(slug) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminGallery({ mode = "gallery" }) {
  const isLibrary = mode === "library";
  const title = isLibrary ? "Media Library" : "Gallery Manager";
  const defaultCategory = isLibrary ? "media-library" : "home-gallery";

  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  const { data: images = [] } = useQuery({
    queryKey: ["galleryImages"],
    queryFn: listGalleries,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["galleryCategories"],
    queryFn: listGalleryCategories,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files) => {
      for (const file of files) {
        await createGalleryImage({
          title: file.name.replace(/\.[^.]+$/, ""),
          category: selectedCategory === "all" ? defaultCategory : selectedCategory,
          description: isLibrary ? "Shared media upload" : "Home gallery image",
          imageFile: file,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGallery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: createGalleryCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryCategories"] });
      setCategoryName("");
      setIsCategoryModalOpen(false);
    },
  });

  const visibleImages = useMemo(() => {
    let result = images;
    if (!isLibrary) {
      result = result.filter((item) => item.category !== "media-library");
    }
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory);
    }
    return result;
  }, [images, isLibrary, selectedCategory]);

  const visibleCategories = useMemo(() => {
    const filtered = isLibrary
      ? categories
      : categories.filter((item) => item.slug !== "media-library");

    return filtered.map((category) => ({
      ...category,
      count: images.filter((item) => item.category === category.slug).length,
    }));
  }, [categories, images, isLibrary]);

  const totalVisibleCount = useMemo(() => {
    if (isLibrary) return images.length;
    return images.filter((item) => item.category !== "media-library").length;
  }, [images, isLibrary]);

  const handleUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    uploadMutation.mutate(files);
    event.target.value = "";
  };

  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900">{title}</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-slate-200 px-4 text-slate-700"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Category
          </Button>
          <Button
            type="button"
            className="h-11 rounded-xl bg-[#2563eb] px-4 text-white hover:bg-[#1d4ed8]"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? "Uploading..." : "Add Images"}
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            selectedCategory === "all"
              ? "bg-[#2563eb] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({totalVisibleCount})
        </button>
        {visibleCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.slug)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedCategory === category.slug
                ? "bg-[#2563eb] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {categoryLabel(category.slug)} ({category.count})
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {visibleImages.map((image) => (
          <div
            key={image.id}
            className="group overflow-hidden rounded-[18px] border border-slate-100 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
          >
            <div className="aspect-[0.9] overflow-hidden bg-slate-100">
              <img
                src={image.image_url}
                alt={image.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-sm font-semibold text-slate-800">{image.title || "Untitled"}</p>
              <p className="truncate text-[11px] uppercase tracking-[0.18em] text-slate-400">
                {categoryLabel(image.category)}
              </p>
            </div>
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <a
                href={image.image_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-[#1d4ed8]"
              >
                Open
              </a>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(image.galleryId)}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {visibleImages.length === 0 && (
        <div className="mt-8 rounded-[22px] border border-dashed border-slate-200 px-6 py-14 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">No images found in this category.</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            <Upload className="h-4 w-4" />
            Upload Images
          </button>
        </div>
      )}

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!categoryName.trim()) return;
              createCategoryMutation.mutate(categoryName.trim().toLowerCase());
            }}
            className="space-y-4"
          >
            <div>
              <Label>Category Name</Label>
              <Input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder={isLibrary ? "media-library" : "annual-day"}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                {createCategoryMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
