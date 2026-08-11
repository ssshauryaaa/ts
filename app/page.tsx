'use client'
import StarfieldBackground from '@/src/components/StarfieldBackground';

export default function LoginPage() {
  return (
    <main className="w-screen h-screen relative overflow-hidden bg-obsidian">
      <StarfieldBackground
        className="fixed inset-0 w-full h-full"
        backgroundColor="#0A0C0E"
        starCount={1200}
        speed={2}
      />
    </main>
  )
}