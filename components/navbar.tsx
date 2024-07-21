import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { UserIcon } from 'lucide-react'
import Link from 'next/link'

export default function Navbar() {

    return (
        <div className="md:sticky md:top-0 md:z-50 md:flex md:items-center md:justify-between md:w-full md:h-12 md:p-2 md:shrink-0 fixed bottom-0 z-50 w-full p-2 flex items-center justify-between bg-background bg-opacity-80">
            <ThemeToggle />
        </div>
    );
}
