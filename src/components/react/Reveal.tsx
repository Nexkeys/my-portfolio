import SplitText from './bits/SplitText';

interface Props {
  text: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
}

/** Word by word rise for big headings. Text stays in the HTML for crawlers. */
export default function Reveal({ text, tag = 'h2', className = '' }: Props) {
  return (
    <SplitText
      text={text}
      tag={tag}
      className={className}
      splitType="words"
      effect="rise"
      mask
      delay={70}
      duration={1.1}
      textAlign="left"
      threshold={0.2}
      rootMargin="-60px"
    />
  );
}
