import { useForm, useWatch } from "react-hook-form";
// import { DatePickerWithRange } from "@/components/date-range-picker";
import { HoursSlider } from "@/components/listings-search/hours-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useEffect } from "react";

export type FilterFormData = {
  dateRange: { from: Date; to: Date };
  timeFrame: number;
  minPrice?: number;
  maxPrice?: number;
  quality?: string;
  limit: number;
  searchTerm?: string;
};

// Common TF2 item qualities
const itemQualities = [
  { value: "any", label: "Any Quality" },
  { value: "Unique", label: "Unique" },
  { value: "Strange", label: "Strange" },
  { value: "Vintage", label: "Vintage" },
  { value: "Genuine", label: "Genuine" },
  { value: "Unusual", label: "Unusual" },
  { value: "Haunted", label: "Haunted" },
  { value: "Collector's", label: "Collector's" },
  { value: "Decorated", label: "Decorated" },
];

// Item count limits
const itemLimits = [
  { value: 9, label: "9 items" },
  { value: 18, label: "18 items" },
  { value: 27, label: "27 items" },
];

interface FilterFormProps {
  isLoading?: boolean;
  onSubmit?: (data: FilterFormData) => void;
}

export default function FilterForm({ 
  isLoading = false,
  onSubmit 
}: FilterFormProps) {
  // Get stored form values or use defaults
  const getStoredFormValues = () => {
    if (typeof window === 'undefined') return defaultFormValues;
    
    const storedValues = localStorage.getItem('listingsFilterForm');
    if (storedValues) {
      const parsedValues = JSON.parse(storedValues);
      // Convert date strings back to Date objects
      return {
        ...parsedValues,
        dateRange: {
          from: parsedValues.dateRange?.from ? new Date(parsedValues.dateRange.from) : new Date(),
          to: parsedValues.dateRange?.to ? new Date(parsedValues.dateRange.to) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      };
    }
    
    // Default values if nothing stored
    return defaultFormValues;
  };

  const defaultFormValues = {
    dateRange: {
      from: new Date(),
      to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    timeFrame: 6,
    minPrice: undefined,
    maxPrice: undefined,
    quality: "any",
    limit: 9,
    searchTerm: undefined
  };

  const { control, handleSubmit, register, reset } = useForm<FilterFormData>({
    defaultValues: getStoredFormValues()
  });

  // Watch all form values and save to localStorage when they change
  const formValues = useWatch({ control });
  useEffect(() => {
    if (formValues) {
      localStorage.setItem('listingsFilterForm', JSON.stringify(formValues));
    }
  }, [formValues]);

  const resetForm = () => {
    reset(defaultFormValues);
    
    const minPriceInput = document.getElementById('minPrice') as HTMLInputElement;
    const maxPriceInput = document.getElementById('maxPrice') as HTMLInputElement;
    const searchInput = document.getElementById('searchTerm') as HTMLInputElement;

    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (searchInput) searchInput.value = '';

    localStorage.removeItem('listingsFilterForm');
  };

  const handleFormSubmit = (data: FilterFormData) => {
    // Convert "any" to undefined for the backend
    // Trim search term and convert empty strings to undefined
    const processedData = {
      ...data,
      quality: data.quality === "any" ? undefined : data.quality,
      searchTerm: data.searchTerm && data.searchTerm.trim() !== '' ? data.searchTerm.trim() : undefined
    };
    
    console.log("Form submitted:", processedData);
    onSubmit?.(processedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Trending Items</h2>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={resetForm} 
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isLoading}> 
            {isLoading ? "Loading..." : "Search"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <HoursSlider
            control={control}
            name="timeFrame"
            label="Time Window"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">Note: Most recent hour not shown (still calculating)</p>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Label htmlFor="quality">Item Quality</Label>
          <Controller
            control={control}
            name="quality"
            render={({ field }) => (
              <Select 
                disabled={isLoading}
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {itemQualities.map((quality) => (
                      <SelectItem key={quality.value} value={quality.value}>
                        {quality.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <Label htmlFor="searchTerm">Search Item Name</Label>
        <Input
          id="searchTerm"
          type="text"
          placeholder="Search for items... (e.g., 'Strange Scattergun')"
          disabled={isLoading}
          {...register("searchTerm", { 
            setValueAs: value => value === "" ? undefined : value?.trim() 
          })}
        />
        <p className="text-xs text-muted-foreground">
          Find items by name using case-insensitive search
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="minPrice">Minimum Price (refined metal)</Label>
          <Input
            id="minPrice"
            type="number"
            step="0.01"
            placeholder="Min price"
            disabled={isLoading}
            {...register("minPrice", { 
              setValueAs: value => value === "" ? undefined : parseFloat(value) 
            })}
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          <Label htmlFor="maxPrice">Maximum Price (refined metal)</Label>
          <Input
            id="maxPrice"
            type="number"
            step="0.01"
            placeholder="Max price"
            disabled={isLoading}
            {...register("maxPrice", { 
              setValueAs: value => value === "" ? undefined : parseFloat(value) 
            })}
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          <Label htmlFor="limit">Show Items</Label>
          <Controller
            control={control}
            name="limit"
            render={({ field }) => (
              <Select 
                disabled={isLoading}
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || "9"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Number of items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {itemLimits.map((limit) => (
                      <SelectItem key={limit.value} value={limit.value.toString()}>
                        {limit.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
    </form>
  );
}