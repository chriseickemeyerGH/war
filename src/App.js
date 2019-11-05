import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { AllCards } from "./AllCards";
import { GlobalStyle } from "./GlobalStyles";
import { cardValue } from "./cardValue";
import { splitDeck } from "./splitDeck";
import { WarModal } from "./WarModal";
import { EndGameModal } from "./EndGameModal";
import { Button } from "./Button";
import { Instructions } from "./Instructions";
import firebase from "./firebaseConfig";
import axios from "axios";

//add actions to end game if 0 cards left after war end

function App() {
  const buttonRef = useRef(null);
  const [id, setID] = useState("");
  const [cardsLeft, setCardsLeft] = useState({ user: null, cpu: null });
  const [cardDrawn, setCardDrawn] = useState({ user: "", cpu: "" });
  const [warCardArrays, setWarCardArrays] = useState({ user: [], cpu: [] });
  const [userDoc, setUserDoc] = useState("");
  const [loggedIn, isLoggedIn] = useState(false);
  const [gameStart, triggerGameStart] = useState(false);
  const [buttonFocus, setButtonFocus] = useState(false);
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
  const errorMessage =
    "There's been an error. Please refresh the page or try again later.";
  const winningMessage = "win";
  const losingMessage = "lose";
  const widthOver1000 = window.innerWidth > 1000;

  useLayoutEffect(() => {
    if (widthOver1000 && document.getElementById("DrawButton")) {
      buttonRef.current.focus();
    }
  }, [buttonFocus, widthOver1000]);

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

  const focusOnButton = () => {
    widthOver1000 && setButtonFocus(!buttonFocus);
  };

  const user_pile = "user_pile";
  const cpu_pile = "cpu_pile";

  const restartGame = () => {
    userDoc.delete().catch(() => alert(errorMessage));
    setWarCardArrays({ user: [], cpu: [] });
    setCardDrawn({ user: "", cpu: "" });
    onGameStartTwo();
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
          onGameStartTwo();
        })
        .catch(() => {
          return alert(errorMessage);
        });
    } else if (loggedIn) {
      onGameStartTwo();
    }
  };

  const afterWinActions = (warWin, numberCardsLeft, resultText) => {
    setTimeout(() => {
      userDoc.delete().catch(() => alert(errorMessage));
      setCardDrawn({ user: "", cpu: "" });
      doStartAnimation({ userWon: false, cpuWon: false });
      //   setDrawDisabled(false);
      warWin && setWarCardArrays({ user: [], cpu: [] });
      //   focusOnButton();
      if (numberCardsLeft < 1) {
        return [
          doShowModal({ ...showModal, endGameModal: true }),
          setResult(resultText)
        ];
      } else {
        setDrawDisabled(false);
        let t = true;
        t && focusOnButton();
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

  const onGameStartTwo = () => {
    //  logUserIn();
    const createDecks = async () => {
      try {
        const res = await axios.get(`${apiStart}/new/draw/?count=52`);
        /* draw all cards from new deck */
        let deck_id = res.data.deck_id;
        setID(deck_id);
        let cards = res.data.cards;
        let arr = [];
        cards.map(item => arr.push(item.code));
        let userStartingDeck = splitDeck(arr, 0, 26);
        let cpuStartingDeck = splitDeck(arr, 26, 52);

        try {
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

          focusOnButton();
        } catch (err) {
          alert(err);
        }
      } catch (err) {
        alert(err);
      }
    };
    createDecks();
  };

  //draw from bottom
  const onDrawTwo = async () => {
    triggerGameStart(true);
    setDrawDisabled(true);
    try {
      let drawCard = "draw/bottom/?count=1";
      const [userDraw, cpuDraw] = await Promise.all([
        axios.get(`${apiStart}/${id}/pile/${user_pile}/${drawCard}`),
        axios.get(`${apiStart}/${id}/pile/${cpu_pile}/${drawCard}`)
      ]);

      let userCards = userDraw.data.cards[0];
      let cpuCards = cpuDraw.data.cards[0];
      let userCardsRemaining = userDraw.data.piles.user_pile.remaining;
      let cpuCardsRemaining = cpuDraw.data.piles.cpu_pile.remaining;

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
      let bothCardCodes = `${userCards.code},${cpuCards.code}`;

      setTimeout(() => {
        if (cardValue(userCards.value) === cardValue(cpuCards.value)) {
          //firstwar
          const warDraw = async () => {
            try {
              let drawTwo = "draw/bottom/?count=2";
              const [userWarDraw, cpuWarDraw] = await Promise.all([
                axios.get(`${apiStart}/${id}/pile/${user_pile}/${drawTwo}`),
                axios.get(`${apiStart}/${id}/pile/${cpu_pile}/${drawTwo}`)
              ]);
              let userData = userWarDraw.data;
              let cpuData = cpuWarDraw.data;
              let warAgainUserRemaining = userData.piles.user_pile.remaining;
              let warAgainCpuRemaining = cpuData.piles.cpu_pile.remaining;
              setCardsLeft({
                user: warAgainUserRemaining,
                cpu: warAgainCpuRemaining
              });
              const drawnCards = (fnData, num) => fnData.cards[num];
              let userFirstCard = drawnCards(userData, 0);
              let userSecondCard = drawnCards(userData, 1);
              let cpuFirstCard = drawnCards(cpuData, 0);
              let cpuSecondCard = drawnCards(cpuData, 1);

              let a = Math.random();
              let b = Math.random();
              let c = Math.random();
              let d = Math.random();

              await userDoc.set(
                {
                  userWarCards: firebase.firestore.FieldValue.arrayUnion(
                    {
                      image: userFirstCard.image,
                      value: userFirstCard.value,
                      suit: userFirstCard.suit,
                      code: userFirstCard.code,
                      face_down: true,
                      id: a
                    },
                    {
                      image: userSecondCard.image,
                      value: userSecondCard.value,
                      suit: userSecondCard.suit,
                      code: userSecondCard.code,
                      id: b
                    }
                  ),
                  cpuWarCards: firebase.firestore.FieldValue.arrayUnion(
                    {
                      image: cpuFirstCard.image,
                      value: cpuFirstCard.value,
                      suit: cpuFirstCard.suit,
                      code: cpuFirstCard.code,
                      face_down: true,
                      id: c
                    },
                    {
                      image: cpuSecondCard.image,
                      value: cpuSecondCard.value,
                      suit: cpuSecondCard.suit,
                      code: cpuSecondCard.code,
                      id: d
                    }
                  )
                },
                { merge: true }
              );
              //compare values of seconds cards

              const doc = await userDoc.get();
              const { cpuWarCards, userWarCards } = doc.data();

              setWarCardArrays({ user: userWarCards, cpu: cpuWarCards });

              let cpuCodesArr = [];
              let userCodesArr = [];
              cpuWarCards.map(item => cpuCodesArr.push(item.code));
              userWarCards.map(item => userCodesArr.push(item.code));
              let cpuCodes = cpuCodesArr.toString();
              let userCodes = userCodesArr.toString();

              let revealCpuCards = cpuWarCards.map(item => ({
                ...item,
                face_down: false
              }));
              let revealUserCards = userWarCards.map(item => ({
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
                      alert(err);
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
                      alert(err);
                    }
                  };
                  setTimeout(() => {
                    cpuWin();
                  }, 1000);
                }
              }, 1700);
            } catch (err) {
              alert(err);
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
              //  endOfGame(cpuCardsRemaining, winningMessage);
            } catch (err) {
              alert(err);
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
              //   endOfGame(userCardsRemaining, losingMessage);
            } catch (err) {
              alert(err);
            }
          })();
        }
      }, 1600);
    } catch (err) {
      alert(err);
    }
  };
  const decksNotSet = () => cardsLeft.user === null && cardsLeft.cpu === null;
  const showGameVals = () => cardsLeft.user !== null && cardsLeft.cpu !== null;

  return (
    <>
      <GlobalStyle />
      {decksNotSet() && (
        <Instructions onStart={onStartGame} loading={loading} />
      )}
      {showGameVals() && (
        <>
          <p>Deck: {cardsLeft.cpu}</p>
          <h2>CPU</h2>
          <AllCards
            cardDrawn={cardDrawn}
            warCardArrays={warCardArrays}
            startAnimation={startAnimation}
          />
          <h2>You</h2>
          <p>Deck: {cardsLeft.user}</p>
          <Button
            disabled={drawDisabled}
            id="DrawButton"
            onClick={onDrawTwo}
            ref={buttonRef}
          >
            Draw
          </Button>

          {!gameStart && widthOver1000 && (
            <p>Click or Press "Enter" / "Space" to draw</p>
          )}
        </>
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
