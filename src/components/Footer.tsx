import { Heart } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t dark:border-gray-700 bg-white dark:bg-gray-900 py-6 px-4 mt-auto">
      <div className="max-w-lg mx-auto flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          Laget med <Heart size={14} className="text-[#E2A9F1] fill-[#E2A9F1]" /> av{" "}
          <Link
            href="https://www.linkedin.com/in/miemarielle/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E2A9F1] hover:underline font-medium"
          >
            Mie Marielle Øverås Vitting
          </Link>
        </p>
        <Link
          href="https://miemarielle.design"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#E2A9F1] transition-colors"
        >
          Denne er designet av dansere, for dansere ✦ miemarielle.design
        </Link>
      </div>
    </footer>
  );
}
