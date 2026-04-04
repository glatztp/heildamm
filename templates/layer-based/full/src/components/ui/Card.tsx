interface CardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function Card({ title, description, children }: CardProps) {
  return (
    <div className="border rounded-lg p-6 flex flex-col gap-2">
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && <p className="text-gray-500 text-sm">{description}</p>}
      {children}
    </div>
  );
}
