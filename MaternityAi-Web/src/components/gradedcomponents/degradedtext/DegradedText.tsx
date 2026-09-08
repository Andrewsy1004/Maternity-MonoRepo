import style from './DegradedText.module.css';

interface DegradedTextProps {
  text: string;
  fontSize?: string;
}
export const DegradedText = ({ text, fontSize }: DegradedTextProps) => {
  return (
    <span
      className={style.text}
      style={{
        fontSize: fontSize,
      }}
    >
      {text}
    </span>
  );
};
