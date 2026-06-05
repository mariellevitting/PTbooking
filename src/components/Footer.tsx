import { Heart } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white py-6 px-4 mt-auto">
      <div className="max-w-lg mx-auto flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-gray-500 flex items-center gap-1.5">
          Laget med <Heart size={14} className="text-purple-500 fill-purple-500" /> av{" "}
          <Link
            href="https://www.linkedin.com/in/miemarielle/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline font-medium"
          >
            Mie Marielle Øverås Vitting
          </Link>
        </p>
        <Link
          href="https://miemarielle.design"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-purple-500 transition-colors"
        >
          Denne er designet av dansere, for dansere ✦ miemarielle.design
        </Link>
      </div>
    </footer>
  );
}
