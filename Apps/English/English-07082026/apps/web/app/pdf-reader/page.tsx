import { BookOpenText, ExternalLink, House } from "lucide-react";
import Link from "next/link";

const DEFAULT_READER_URL =
  "https://study-tracker-plan-five.vercel.app/pdf-reader";

type ReaderSearchParams = Record<string, string | string[] | undefined>;

function readerUrl(searchParams: ReaderSearchParams) {
  const target = new URL(
    process.env.PDF_READER_EMBED_URL?.trim() || DEFAULT_READER_URL,
  );
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => target.searchParams.append(key, item));
    } else if (value) {
      target.searchParams.set(key, value);
    }
  }
  target.searchParams.set("lang", "en");
  return target.toString();
}

export const metadata = { title: "Notebook & PDF Reader" };

export default async function PdfReaderPage({
  searchParams,
}: {
  searchParams: Promise<ReaderSearchParams>;
}) {
  const source = readerUrl(await searchParams);

  return (
    <div className="page-stack pdf-reader-bridge">
      <header className="pdf-reader-bridge__header">
        <div className="pdf-reader-bridge__title" dir="auto">
          <span className="pdf-reader-bridge__icon" aria-hidden>
            <BookOpenText />
          </span>
          <div>
            <h1>Notebook & PDF Reader</h1>
            <p>Open PDFs, highlight text, add notes, translate, and export your work.</p>
          </div>
        </div>
        <nav className="pdf-reader-bridge__actions" aria-label="PDF Reader navigation">
          <Link className="pdf-reader-bridge__button" href="/">
            <House aria-hidden /> Home
          </Link>
          <a
            className="pdf-reader-bridge__button pdf-reader-bridge__button--primary"
            href={source}
            rel="noreferrer"
            target="_blank"
          >
            Open full screen <ExternalLink aria-hidden />
          </a>
        </nav>
      </header>
      <div className="pdf-reader-bridge__frame-wrap">
        <iframe
          allow="clipboard-read; clipboard-write"
          className="pdf-reader-bridge__frame"
          src={source}
          title="Research PDF Studio"
        />
      </div>
      <p className="pdf-reader-bridge__help" dir="auto">
        The reader is connected to the web version, so it also opens on Windows and Android tablets without installing a separate reader.
      </p>
    </div>
  );
}
