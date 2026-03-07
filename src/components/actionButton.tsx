const ActionButton = ({ type }: { type: string }) => {
  return <img src={`/${type}.png`} alt={type} className="w-4 h-4" />;
};

export default ActionButton;
