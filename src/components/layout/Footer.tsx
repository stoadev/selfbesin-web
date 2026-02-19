export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-[calc(0.2rem+env(safe-area-inset-bottom,0px))] text-center text-xs text-gray-400 dark:text-gray-600">
        © {new Date().getFullYear()}{" "}
        <a
          href="https://stoadev.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 dark:text-emerald-500 hover:underline"
        >
          StoaDev
        </a>
        . Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
