import type { ComponentChildren, JSX } from "preact";

export type CardProps = {
  readonly children?: ComponentChildren;
  readonly className?: string;
  readonly as?: "div" | "section" | "article";
};

export const CARD_CSS = `
.rdw-card {
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-1);
}
`;

export function Card(props: CardProps): JSX.Element {
  const Tag = props.as ?? "div";
  const className = ["rdw-card", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{CARD_CSS}</style>
      <Tag className={className}>{props.children}</Tag>
    </>
  );
}
