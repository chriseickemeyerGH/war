export const cardValue = data => {
  if (data === "JACK") return 11;
  if (data === "QUEEN") return 12;
  if (data === "KING") return 13;
  if (data === "ACE") return 14;
  else return Number(data);
};
