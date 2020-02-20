import React, { useState, useRef } from "react";
import { GlobalStyle } from "./GlobalStyles";
import { cardValue } from "./cardValue";
import { splitDeck } from "./splitDeck";
import { WarModal } from "./WarModal";
import { EndGameModal } from "./EndGameModal";
import { Button } from "./Button";
import { Instructions } from "./Instructions";
import { GameTable } from "./GameTable";

import axios from "axios";

function App() {
  const buttonRef = useRef(null);
  const [id, setID] = useState("");
  const [cardsLeft, setCardsLeft] = useState({ user: null, cpu: null });
  const [cardDrawn, setCardDrawn] = useState({ user: "", cpu: "" });
  const [warCardArrays, setWarCardArrays] = useState({ user: [], cpu: [] });
  const [gameStart, triggerGameStart] = useState(false);
  const [drawDisabled, setDrawDisabled] = useState(false);
  const [showModal, doShowModal] = useState({
    warModal: false,
    endGameModal: false
  });
  const [result, setResult] = useState("");
  const [startAnimation, doStartAnimation] = useState({
    userWon: false,
    cpuWon: false
  });

  const apiStart = `https://deckofcardsapi.com/api/deck`;

  const winningMessage = "win",
    losingMessage = "lose";

  const widthOver1000 = window.innerWidth > 1000;

  const focusOnDrawButton = () => widthOver1000 && buttonRef.current.focus();

  const user_pile = "user_pile",
    cpu_pile = "cpu_pile";

  const restartGame = () => {
    setWarCardArrays({ user: [], cpu: [] });
    setCardDrawn({ user: "", cpu: "" });
    doShowModal({ ...showModal, endGameModal: false });
    onGameStart();
  };

  const afterWinActions = (warWin, numberCardsLeft, resultText) => {
    setTimeout(() => {
      if (warWin) {
        setWarCardArrays({ user: [], cpu: [] });
      }

      setCardDrawn({ user: "", cpu: "" });
      doStartAnimation({ userWon: false, cpuWon: false });

      if (numberCardsLeft < 1) {
        return [
          doShowModal({ ...showModal, endGameModal: true }),
          setResult(resultText)
        ];
      } else {
        setDrawDisabled(false);
        focusOnDrawButton();
      }
    }, 310);
  };

  const warActions = (user_cards_left, cpu_cards_left, warCardsFn) => {
    doShowModal({ ...showModal, warModal: true });
    setTimeout(() => {
      doShowModal({ ...showModal, warModal: false });
    }, 1100);

    setTimeout(() => {
      const outOfCards = message => {
        doShowModal({ warModal: false, endGameModal: true });
        setResult(message);
      };

      if (user_cards_left < 2) {
        return outOfCards(losingMessage);
      } else if (cpu_cards_left < 2) {
        return outOfCards(winningMessage);
      } else {
        setTimeout(() => {
          warCardsFn();
        }, 500);
      }
    }, 1200);
  };

  const onGameStart = () => {
    const createDecks = async () => {
      try {
        const res = await axios.get(`${apiStart}/new/draw/?count=52`);
        /* draw all cards from new deck */
        const deck_id = res.data.deck_id;
        setID(deck_id);
        const cards = res.data.cards;
        const arr = [];
        cards.map(item => arr.push(item.code));
        const userStartingDeck = splitDeck(arr, 0, 26),
          cpuStartingDeck = splitDeck(arr, 26, 52);

        const [user_deck, cpu_deck] = await Promise.all([
          axios.get(
            `${apiStart}/${deck_id}/pile/${user_pile}/add/?cards=${userStartingDeck}`
          ),
          axios.get(
            `${apiStart}/${deck_id}/pile/${cpu_pile}/add/?cards=${cpuStartingDeck}`
          )
        ]);

        setCardsLeft({
          user: user_deck.data.piles.user_pile.remaining,
          cpu: cpu_deck.data.piles.cpu_pile.remaining
        });
        setDrawDisabled(false);
        focusOnDrawButton();
      } catch (err) {
        onError(err);
      }
    };
    createDecks();
  };

  const onError = err => {
    alert(err);
    setDrawDisabled(false);
  };
  //draw from bottom
  const onDraw = async () => {
    triggerGameStart(true);
    setDrawDisabled(true);
    try {
      const drawCard = "draw/bottom/?count=1";
      const [userDraw, cpuDraw] = await Promise.all([
        axios.get(`${apiStart}/${id}/pile/${user_pile}/${drawCard}`),
        axios.get(`${apiStart}/${id}/pile/${cpu_pile}/${drawCard}`)
      ]);

      const userCard = userDraw.data.cards[0],
        cpuCard = cpuDraw.data.cards[0],
        userCardsRemaining = userDraw.data.piles.user_pile.remaining,
        cpuCardsRemaining = cpuDraw.data.piles.cpu_pile.remaining;

      setCardsLeft({
        user: userCardsRemaining,
        cpu: cpuCardsRemaining
      });
      setCardDrawn({
        user: {
          image: userCard.image,
          value: userCard.value,
          suit: userCard.suit
        },
        cpu: {
          image: cpuCard.image,
          value: cpuCard.value,
          suit: cpuCard.suit
        }
      });
      const bothCardCodes = `${userCard.code},${cpuCard.code}`;

      setTimeout(() => {
        const userWarCardsArray = [];
        const cpuWarCardsArray = [];

        if (cardValue(userCard.value) === cardValue(cpuCard.value)) {
          //firstwar

          const warDraw = async () => {
            try {
              const drawTwo = "draw/bottom/?count=2";
              const [userWarDraw, cpuWarDraw] = await Promise.all([
                axios.get(`${apiStart}/${id}/pile/${user_pile}/${drawTwo}`),
                axios.get(`${apiStart}/${id}/pile/${cpu_pile}/${drawTwo}`)
              ]);
              const userData = userWarDraw.data,
                cpuData = cpuWarDraw.data,
                warAgainUserRemaining = userData.piles.user_pile.remaining,
                warAgainCpuRemaining = cpuData.piles.cpu_pile.remaining;

              setCardsLeft({
                user: warAgainUserRemaining,
                cpu: warAgainCpuRemaining
              });

              const drawnCards = (fnData, num) => fnData.cards[num];

              const userFirstCard = drawnCards(userData, 0),
                userSecondCard = drawnCards(userData, 1),
                cpuFirstCard = drawnCards(cpuData, 0),
                cpuSecondCard = drawnCards(cpuData, 1);

              const setCardObject = (image, value, suit, code, face_down) => ({
                image: image,
                value: value,
                suit: suit,
                code: code,
                face_down: face_down,
                id: `${value} of ${suit}`
              });
              let { image, value, suit, code } = userFirstCard;
              const userCardOne = setCardObject(image, value, suit, code, true);

              ({ image, value, suit, code } = userSecondCard);
              const userCardTwo = setCardObject(
                image,
                value,
                suit,
                code,
                false
              );

              userWarCardsArray.push(userCardOne, userCardTwo);

              ({ image, value, suit, code } = cpuFirstCard);
              const cpuCardOne = setCardObject(image, value, suit, code, true);

              ({ image, value, suit, code } = cpuSecondCard);
              const cpuCardTwo = setCardObject(image, value, suit, code, false);

              cpuWarCardsArray.push(cpuCardOne, cpuCardTwo);

              setWarCardArrays({
                user: userWarCardsArray,
                cpu: cpuWarCardsArray
              });

              setTimeout(() => {
                if (
                  cardValue(userSecondCard.value) ===
                  cardValue(cpuSecondCard.value)
                ) {
                  warActions(
                    warAgainUserRemaining,
                    warAgainCpuRemaining,
                    warDraw
                  );
                } else {
                  const cpuCodesArr = [],
                    userCodesArr = [];

                  const pushCodes = (cardArray, pushArray) =>
                    cardArray.forEach(item => pushArray.push(item.code));

                  pushCodes(cpuWarCardsArray, cpuCodesArr);
                  pushCodes(userWarCardsArray, userCodesArr);

                  const revealCards = cardArray =>
                    cardArray.map(item => ({
                      ...item,
                      face_down: false
                    }));

                  const revealCpuCards = revealCards(cpuWarCardsArray);
                  const revealUserCards = revealCards(userWarCardsArray);

                  setWarCardArrays({
                    user: revealUserCards,
                    cpu: revealCpuCards
                  });
                  if (
                    cardValue(userSecondCard.value) >
                    cardValue(cpuSecondCard.value)
                  ) {
                    //user wins war

                    const userWin = async () => {
                      try {
                        const res = await axios.get(
                          `${apiStart}/${id}/pile/${user_pile}/add/?cards=${bothCardCodes},${userCodesArr},${cpuCodesArr}`
                        );
                        setTimeout(() => {
                          setCardsLeft({
                            user: res.data.piles.user_pile.remaining,
                            cpu: warAgainCpuRemaining
                          });
                          doStartAnimation({
                            ...startAnimation,
                            userWon: true
                          });
                          afterWinActions(
                            true,
                            warAgainCpuRemaining,
                            winningMessage
                          );
                        }, 2000);
                      } catch (err) {
                        onError(err);
                      }
                    };
                    setTimeout(() => {
                      userWin();
                    }, 1000);
                  }
                  if (
                    cardValue(userSecondCard.value) <
                    cardValue(cpuSecondCard.value)
                  ) {
                    //cpu wins war

                    const cpuWin = async () => {
                      try {
                        const res = await axios.get(
                          `${apiStart}/${id}/pile/${cpu_pile}/add/?cards=${bothCardCodes},${cpuCodesArr},${userCodesArr}`
                        );
                        setTimeout(() => {
                          setCardsLeft({
                            cpu: res.data.piles.cpu_pile.remaining,
                            user: warAgainUserRemaining
                          });
                          doStartAnimation({ ...startAnimation, cpuWon: true });
                          afterWinActions(
                            true,
                            warAgainUserRemaining,
                            losingMessage
                          );
                        }, 2000);
                      } catch (err) {
                        onError(err);
                      }
                    };
                    setTimeout(() => {
                      cpuWin();
                    }, 1000);
                  }
                }
              }, 1700);
            } catch (err) {
              onError(err);
            }
          };

          warActions(userCardsRemaining, cpuCardsRemaining, warDraw);
        } else if (cardValue(userCard.value) > cardValue(cpuCard.value)) {
          //user card greater
          (async () => {
            try {
              const res = await axios.get(
                `${apiStart}/${id}/pile/${user_pile}/add/?cards=${bothCardCodes}`
              );

              doStartAnimation({ ...startAnimation, userWon: true });
              setCardsLeft({
                user: res.data.piles.user_pile.remaining,
                cpu: cpuCardsRemaining
              });
              afterWinActions(false, cpuCardsRemaining, winningMessage);
            } catch (err) {
              onError(err);
            }
          })();
        } else if (cardValue(userCard.value) < cardValue(cpuCard.value)) {
          //cpu card greater
          (async () => {
            try {
              const res = await axios.get(
                `${apiStart}/${id}/pile/${cpu_pile}/add/?cards=${bothCardCodes}`
              );

              doStartAnimation({ ...startAnimation, cpuWon: true });
              setCardsLeft({
                user: userCardsRemaining,
                cpu: res.data.piles.cpu_pile.remaining
              });
              afterWinActions(false, userCardsRemaining, losingMessage);
            } catch (err) {
              onError(err);
            }
          })();
        }
      }, 1600);
    } catch (err) {
      onError(err);
    }
  };
  const decksNotSet = cardsLeft.user === null && cardsLeft.cpu === null,
    showGameVals = cardsLeft.user !== null && cardsLeft.cpu !== null;

  return (
    <>
      <GlobalStyle />
      {decksNotSet && <Instructions onStart={onGameStart} />}
      {showGameVals && (
        <GameTable
          cardsLeft={cardsLeft}
          cardDrawn={cardDrawn}
          warCardArrays={warCardArrays}
          startAnimation={startAnimation}
          drawButton={
            <Button
              disabled={drawDisabled}
              id="DrawButton"
              onClick={onDraw}
              ref={buttonRef}
            >
              Draw
            </Button>
          }
          gameStart={gameStart}
          widthOver1000={widthOver1000}
        />
      )}
      <WarModal startAnimation={showModal.warModal} />
      <EndGameModal
        startAnimation={showModal.endGameModal}
        gameResult={result}
        onGameRestart={restartGame}
      />
    </>
  );
}

export default App;
