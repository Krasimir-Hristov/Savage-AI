import { Skeleton } from '@/shared/components/ui/skeleton';

const AuthLoading = (): React.JSX.Element => {
  return (
    <div className='overflow-hidden rounded-[28px] border border-border/70 bg-card/85 shadow-[0_24px_120px_oklch(0_0_0/0.55)] backdrop-blur-sm'>
      <div className='space-y-5 border-b border-border/70 px-4 py-6 sm:px-6'>
        <Skeleton className='h-6 w-28 rounded-full bg-character-grandpa-muted' />
        <div className='space-y-3'>
          <Skeleton className='h-10 w-3/4 bg-secondary' />
          <Skeleton className='h-5 w-full bg-secondary' />
        </div>
        <Skeleton className='h-16 w-full rounded-2xl bg-secondary' />
      </div>

      <div className='space-y-5 px-4 py-6 sm:px-6'>
        <Skeleton className='h-12 w-full rounded-2xl bg-background' />
        <Skeleton className='h-12 w-full rounded-2xl bg-background' />
      </div>

      <div className='border-t border-border/70 bg-secondary/35 p-4 sm:p-5'>
        <Skeleton className='h-12 w-full rounded-2xl bg-secondary' />
      </div>
    </div>
  );
};

export default AuthLoading;
