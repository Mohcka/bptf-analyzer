import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col items-center justify-center pb-2 px-3 md:px-4">
        <Skeleton className="w-32 h-32 rounded-md" />
        <div className="text-center mt-2 w-full">
          <Skeleton className="h-5 w-full max-w-[180px] mx-auto" />
          <Skeleton className="h-4 w-24 mt-2 mx-auto" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 w-full pt-2 px-3 md:px-4 border-t">
        <div className="flex justify-between w-full">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex justify-between w-full">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex justify-between w-full">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>

      <CardFooter className="pt-3 px-3 md:pt-4 md:px-4 pb-4">
        <Skeleton className="h-[150px] w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}
