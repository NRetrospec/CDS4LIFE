import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist px-4 py-10">
      <SignUp />
    </main>
  );
}
