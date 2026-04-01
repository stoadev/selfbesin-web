export default function HighlightedText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  if (!highlight.trim()) return <span className="font-bold">{text}</span>;

  const queryWords = highlight.toLocaleLowerCase("tr").trim().split(/\s+/);
  const textLower = text.toLocaleLowerCase("tr");

  let lastMatchEnd = 0;

  queryWords.forEach((qw) => {
    const pos = textLower.indexOf(qw, lastMatchEnd);
    if (pos !== -1) {
      lastMatchEnd = pos + qw.length;
    }
  });

  if (lastMatchEnd === 0) return <span className="font-bold">{text}</span>;

  return (
    <>
      <span className="font-normal opacity-70">
        {text.substring(0, lastMatchEnd)}
      </span>
      <span className="font-bold">{text.substring(lastMatchEnd)}</span>
    </>
  );
}
