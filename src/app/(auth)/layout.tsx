import { Badge } from '@/components/ui/badge';

const AuthLayout = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  return (
    <div className='relative min-h-screen overflow-hidden bg-background text-foreground'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.5278_0.2399_29.23/0.18),transparent_28%),radial-gradient(circle_at_bottom_right,oklch(0.596_0.2387_41.12/0.12),transparent_24%)]' />
      <div className='absolute inset-0 opacity-30 bg-[linear-gradient(to_right,oklch(1_0_0/0.05)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.05)_1px,transparent_1px)] bg-size-[72px_72px]' />
      <div className='absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(0.087_0_0/0.72)_78%,oklch(0.087_0_0))]' />

      <div className='relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8'>
        <div className='grid w-full gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,480px)] lg:items-center'>
          <section className='hidden lg:flex lg:min-h-155 lg:flex-col lg:justify-between lg:rounded-[32px] lg:border lg:border-border/70 lg:bg-card/55 lg:p-10 lg:shadow-[0_24px_120px_oklch(0_0_0/0.45)] lg:backdrop-blur-sm'>
            <div className='space-y-6'>
              <Badge className='w-fit bg-character-grandpa-muted px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-character-grandpa'>
                Secured Access
              </Badge>

              <div className='space-y-5'>
                <p className='text-sm font-medium uppercase tracking-[0.32em] text-character-dad'>
                  SavageAI Identity Gate
                </p>
                <div className='space-y-4'>
                  <h1 className='max-w-xl font-heading text-5xl font-semibold leading-[0.95] text-foreground'>
                    Enter the chat where the answers hit back.
                  </h1>
                  <p className='max-w-lg text-lg leading-8 text-muted-foreground'>
                    A sharper login experience for a darker product: cinematic atmosphere, brutal
                    clarity, and enough edge to feel unmistakably SavageAI.
                  </p>
                </div>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='rounded-2xl border border-border/70 bg-background/70 p-4'>
                <p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>Tone</p>
                <p className='mt-2 text-sm font-medium text-foreground'>Savage, but useful</p>
              </div>
              <div className='rounded-2xl border border-border/70 bg-background/70 p-4'>
                <p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>Accent</p>
                <p className='mt-2 text-sm font-medium text-character-grandpa'>Crimson authority</p>
              </div>
              <div className='rounded-2xl border border-border/70 bg-background/70 p-4'>
                <p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>Result</p>
                <p className='mt-2 text-sm font-medium text-amber'>Fast, focused access</p>
              </div>
            </div>
          </section>

          <section className='flex min-h-[calc(100vh-4rem)] items-center justify-center lg:min-h-0'>
            <div className='w-full max-w-116 space-y-6'>
              <div className='space-y-3 lg:hidden'>
                <Badge className='w-fit bg-character-grandpa-muted px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-character-grandpa'>
                  SavageAI
                </Badge>
                <div className='space-y-2'>
                  <h1 className='font-heading text-3xl font-semibold leading-tight text-foreground'>
                    Enter the chat where the answers hit back.
                  </h1>
                  <p className='max-w-md text-sm leading-7 text-muted-foreground'>
                    Secure access to the sharpest Bulgarian AI personalities on the internet.
                  </p>
                </div>
              </div>

              {children}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
