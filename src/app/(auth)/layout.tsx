const AuthLayout = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
      {children}
    </div>
  );
};

export default AuthLayout;
