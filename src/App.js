import React, { useState, useEffect, useRef } from "react";
import { GlobalStyle } from "./GlobalStyles";
import { cardValue } from "./cardValue";
import { splitDeck } from "./splitDeck";
import { WarModal } from "./WarModal";
import { EndGameModal } from "./EndGameModal";
import { Button } from "./Button";
import { Instructions } from "./Instructions";
import { GameTable } from "./GameTable";
import firebase from "./firebaseConfig";
import axios from "axios";

function App() {
  const buttonRef = useRef(null);
  const [id, setID] = useState("");
  const [cardsLeft, setCardsLeft] = useState({ user: null, cpu: null });
  const [cardDrawn, setCardDrawn] = useState({ user: "", cpu: "" });
  const [warCardArrays, setWarCardArrays] = useState({ user: [], cpu: [] });
  const [userDoc, setUserDoc] = useState("");
  const [loggedIn, isLoggedIn] = useState(false);
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
  const [loading, isLoading] = useState(false);

  const apiStart = `https://deckofcardsapi.com/api/deck`;

  const winningMessage = "win",
    losingMessage = "lose";

  useEffect(() => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        setUserDoc(
          firebase
            .firestore()
            .collection("collection")
            .doc(user.uid)
        );
        isLoggedIn(true);
      } else {
        isLoggedIn(false);
      }
    });
  }, []);
  const widthOver1000 = window.innerWidth > 1000;

  const focusOnDrawButton = () => widthOver1000 && buttonRef.current.focus();

  const user_pile = "user_pile",
    cpu_pile = "cpu_pile";

  const restartGame = () => {
    userDoc.delete().catch(err => onError(err));
    setWarCardArrays({ user: [], cpu: [] });
    setCardDrawn({ user: "", cpu: "" });
    onGameStart();
    doShowModal({ ...showModal, endGameModal: false });
  };

  const onStartGame = () => {
    if (!loggedIn) {
      isLoading(true);
      firebase
        .auth()
        .signInAnonymously()
        .then(() => {
          isLoading(false);
          onGameStart();
        })
        .catch(err => {
          onError(err);
        });
    } else onGameStart();
  };

  const afterWinActions = (warWin, numberCardsLeft, resultText) => {
    setTimeout(() => {
      userDoc.delete().catch(err => onError(err));
      setCardDrawn({ user: "", cpu: "" });
      doStartAnimation({ userWon: false, cpuWon: false });
      warWin && setWarCardArrays({ user: [], cpu: [] });
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
      if (user_cards_left < 2) {
        return [
          doShowModal({ warModal: false, endGameModal: true }),
          setResult(losingMessage)
        ];
      } else if (cpu_cards_left < 2) {
        return [
          doShowModal({ warModal: false, endGameModal: true }),
          setResult(winningMessage)
        ];
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

      const userCards = userDraw.data.cards[0],
        cpuCards = cpuDraw.data.cards[0],
        userCardsRemaining = userDraw.data.piles.user_pile.remaining,
        cpuCardsRemaining = cpuDraw.data.piles.cpu_pile.remaining;

      setCardsLeft({
        user: userCardsRemaining,
        cpu: cpuCardsRemaining
      });
      setCardDrawn({
        user: {
          image: userCards.image,
          value: userCards.value,
          suit: userCards.suit
        },
        cpu: {
          image: cpuCards.image,
          value: cpuCards.value,
          suit: cpuCards.suit
        }
      });
      const bothCardCodes = `${userCards.code},${cpuCards.code}`;

      setTimeout(() => {
        if (cardValue(userCards.value) === cardValue(cpuCards.value)) {
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

              await userDoc.set(
                {
                  userWarCards: firebase.firestore.FieldValue.arrayUnion(
                    {
                      image: userFirstCard.image,
                      value: userFirstCard.value,
                      suit: userFirstCard.suit,
                      code: userFirstCard.code,
                      face_down: true,
                      id: `${userFirstCard.value} of ${userFirstCard.suit}`
                    },
                    {
                      image: userSecondCard.image,
                      value: userSecondCard.value,
                      suit: userSecondCard.suit,
                      code: userSecondCard.code,
                      id: `${userSecondCard.value} of ${userSecondCard.suit}`
                    }
                  ),
                  cpuWarCards: firebase.firestore.FieldValue.arrayUnion(
                    {
                      image: cpuFirstCard.image,
                      value: cpuFirstCard.value,
                      suit: cpuFirstCard.suit,
                      code: cpuFirstCard.code,
                      face_down: true,
                      id: `${cpuFirstCard.value} of ${cpuFirstCard.suit}`
                    },
                    {
                      image: cpuSecondCard.image,
                      value: cpuSecondCard.value,
                      suit: cpuSecondCard.suit,
                      code: cpuSecondCard.code,
                      id: `${cpuSecondCard.value} of ${cpuSecondCard.suit}`
                    }
                  )
                },
                { merge: true }
              );
              //compare values of seconds cards

              const doc = await userDoc.get();
              const { cpuWarCards, userWarCards } = doc.data();

              setWarCardArrays({ user: userWarCards, cpu: cpuWarCards });

              const cpuCodesArr = [],
                userCodesArr = [],
                cpuCodes = cpuCodesArr.toString(),
                userCodes = userCodesArr.toString();

              cpuWarCards.forEach(item => cpuCodesArr.push(item.code));
              userWarCards.forEach(item => userCodesArr.push(item.code));

              const revealCpuCards = cpuWarCards.map(item => ({
                ...item,
                face_down: false
              }));
              const revealUserCards = userWarCards.map(item => ({
                ...item,
                face_down: false
              }));

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
                } else if (
                  cardValue(userSecondCard.value) >
                  cardValue(cpuSecondCard.value)
                ) {
                  //user wins war

                  const userWin = async () => {
                    setWarCardArrays({
                      user: revealUserCards,
                      cpu: revealCpuCards
                    });
                    try {
                      const res = await axios.get(
                        `${apiStart}/${id}/pile/${user_pile}/add/?cards=${bothCardCodes},${userCodes},${cpuCodes}`
                      );
                      setTimeout(() => {
                        setCardsLeft({
                          user: res.data.piles.user_pile.remaining,
                          cpu: warAgainCpuRemaining
                        });
                        doStartAnimation({ ...startAnimation, userWon: true });
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
                } else if (
                  cardValue(userSecondCard.value) <
                  cardValue(cpuSecondCard.value)
                ) {
                  //cpu wins war

                  const cpuWin = async () => {
                    setWarCardArrays({
                      user: revealUserCards,
                      cpu: revealCpuCards
                    });
                    try {
                      const res = await axios.get(
                        `${apiStart}/${id}/pile/${cpu_pile}/add/?cards=${bothCardCodes},${cpuCodes},${userCodes}`
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
              }, 1700);
            } catch (err) {
              onError(err);
            }
          };

          warActions(userCardsRemaining, cpuCardsRemaining, warDraw);
        } else if (cardValue(userCards.value) > cardValue(cpuCards.value)) {
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
        } else if (cardValue(userCards.value) < cardValue(cpuCards.value)) {
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
      {decksNotSet && <Instructions onStart={onStartGame} loading={loading} />}
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
