"use client";

import { useState } from "react";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IMAGE_CATALOG,
  IMAGE_CATEGORIES,
  type ImageCategory,
} from "@/lib/image-catalog";
import { useCreateFormStore } from "@/stores/create-form-store";
import { getCatalogDefaults } from "@/lib/smart-defaults";

export function ImagePicker() {
  const { imageName, imageTag, setImage, applyDefaults } = useCreateFormStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ImageCategory | "all">("all");

  const filtered = IMAGE_CATALOG.filter((img) => {
    const matchesSearch =
      !search ||
      img.displayName.toLowerCase().includes(search.toLowerCase()) ||
      img.name.toLowerCase().includes(search.toLowerCase()) ||
      img.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || img.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function handleSelectImage(name: string, defaultTag: string, displayName: string) {
    setImage(name, defaultTag, displayName);
    const defaults = getCatalogDefaults(name);
    if (defaults) {
      applyDefaults(defaults);
    }
  }

  function handleTagChange(tag: string) {
    const store = useCreateFormStore.getState();
    setImage(store.imageName, tag, store.imageDisplayName);
  }

  const selectedImage = IMAGE_CATALOG.find((img) => img.name === imageName);

  return (
    <div className="space-y-4">
      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as ImageCategory | "all")}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {IMAGE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Image Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((img) => {
          const isSelected = imageName === img.name;
          return (
            <Card
              key={img.name}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() =>
                handleSelectImage(img.name, img.defaultTag, img.displayName)
              }
            >
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{img.displayName}</p>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {img.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {img.category}
                  </Badge>
                  {img.officialImage && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Official
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No images found. Try a different search.
        </p>
      )}

      {/* Tag selector — shown when image is selected */}
      {selectedImage && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm font-medium shrink-0">
            {selectedImage.displayName} tag:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedImage.popularTags.map((tag) => (
              <Badge
                key={tag}
                variant={imageTag === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleTagChange(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
