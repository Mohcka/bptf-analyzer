import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex items-center justify-center pb-2">
        <Skeleton className="w-32 h-32 rounded-md" />
      </CardHeader>
      <CardContent className="text-center pb-2">
        <Skeleton className="h-6 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-sm w-full pt-2 border-t">
        <div className="flex justify-between w-full">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between w-full">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between w-full">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardFooter>
    </Card>
  );
}
