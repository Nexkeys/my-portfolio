import DecryptedText from './bits/DecryptedText';

export default function Decrypt({ text, className = '' }: { text: string; className?: string }) {
  return (
    <DecryptedText
      text={text}
      animateOn="inViewHover"
      sequential
      revealDirection="start"
      speed={40}
      characters="abcdefghijklmnopqrstuvwxyz0123456789/$#@"
      parentClassName={className}
    />
  );
}
