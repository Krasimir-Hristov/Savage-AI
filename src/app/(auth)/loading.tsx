import { Skeleton } from '@/components/ui/skeleton';

const AuthLoading = (): React.JSX.Element => {
  return (
    <div className="w-full max-w-sm space-y-4 rounded-lg border border-[#1E1E1E] bg-[#141414] p-6">
      <Skeleton className="h-8 w-3/4 bg-[#1E1E1E]" />
      <Skeleton className="h-4 w-full bg-[#1E1E1E]" />

      <div className="space-y-3">
        <Skeleton className="h-10 w-full bg-[#1E1E1E]" />
        <Skeleton className="h-10 w-full bg-[#1E1E1E]" />
      </div>

      <Skeleton className="h-10 w-full bg-[#1E1E1E]" />
    </div>
  );
};

export default AuthLoading;
