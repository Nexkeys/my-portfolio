import ScrollReveal from './bits/ScrollReveal';

export default function Statement({ text }: { text: string }) {
  return (
    <ScrollReveal
      baseOpacity={0.12}
      enableBlur
      blurStrength={6}
      baseRotation={0}
      containerClassName="statement"
      textClassName="statement-text"
      wordAnimationEnd="center center"
    >
      {text}
    </ScrollReveal>
  );
}
