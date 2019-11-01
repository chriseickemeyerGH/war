export const cardValue = data => {
  if (data === "KING" || data === "QUEEN" || data === "JACK") return 10;
  if (data === "ACE") return 11;
  else return Number(data);
};
