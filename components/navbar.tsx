import { ThemeToggle } from '@/components/theme-toggle';
import { TwitterX,Github } from '@/components/ui/social-icons';
import Link from 'next/link';

interface NavbarProps {
  categories: { id: string; name: string }[];
}

const Navbar: React.FC<NavbarProps> = ({ categories }) => {
  return (
    <div className="md:sticky md:top-0 md:z-50 md:flex md:items-center md:justify-between md:w-full md:h-12 md:p-2 md:shrink-0 fixed bottom-0 z-50 w-full p-2 flex items-center justify-between bg-background bg-opacity-80">
      <ThemeToggle />
      <nav className="py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <ul className="flex space-x-4">
            <li key="all">
              <Link href="/">
                All
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/category/${encodeURIComponent(category.name)}`}>
                  {category.name}
                </Link>
              </li>
            ))}
            {process.env.GITHUB &&
              <li key="github">
                <a href={process.env.GITHUB} target='_blank'><Github width={20} height={20}/></a>
              </li>
            }
            {process.env.TWITTER &&
              <li key="x">
                <a href={process.env.TWITTER} target='_blank'><TwitterX width={20} height={20}/></a>
              </li>
            }
          </ul>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
