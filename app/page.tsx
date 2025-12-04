// Change this:
// import KalapastanganExperience from "../components/KalapastanganExperience";

// To this (The '@' symbol points to your project root):
import KalapastanganExperience from "@/components/KalapastanganExperience"; 

export default function Home() {
  return (
    <main className="w-screen h-screen">
      <KalapastanganExperience />
    </main>
  );
}