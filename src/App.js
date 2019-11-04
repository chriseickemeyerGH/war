import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { AllWarCards } from "./AllWarCards";
import { GlobalStyle } from "./GlobalStyles";
import { cardValue } from "./cardValue";
import { splitDeck } from "./splitDeck";
import { DrawnCard } from "./DrawnCard";
import { WarModal } from "./WarModal";
import { EndGameModal } from "./EndGameModal";
import { Button } from "./Button";
import { Instructions } from "./Instructions";
import firebase from "./firebaseConfig";
import axios from "axios";

/*
free: company branding, no url changes, no access to analytics, storage limit
paid: remove company branding, unlimited url changes, analytics, storage limit increased
*/
//add actions to end game if 0 cards left after war end

function App() {
  const buttonRef = useRef(null);
  const [id, setID] = useState("");
  const [cardsLeft, setCardsLeft] = useState({ user: "", cpu: "" });
  const [cardDrawn, setCardDrawn] = useState({ user: "", cpu: "" });
  const [warCardArrays, setWarCardArrays] = useState({ user: [], cpu: [] });
  const [userDoc, setUserDoc] = useState("");
  const [loggedIn, isLoggedIn] = useState(null);
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
  const [widthOver1000] = useState(window.innerWidth > 1000);
  const apiStart = `https://deckofcardsapi.com/api/deck`;
  const errorMessage =
    "There's been an error. Please refresh the page or try again later.";

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

  const showWarModal = () => {
    doShowModal({ ...showModal, warModal: true });
    setTimeout(() => {
      doShowModal({ ...showModal, warModal: false });
    }, 1100);
  };

  const restartGame = () => {
    userDoc.delete().catch(() => alert(errorMessage));
    setDrawDisabled(false);
    setWarCardArrays({ user: [], cpu: [] });
    setCardDrawn({ user: "", cpu: "" });
    setTimeout(() => {
      onGameStartTwo();
      doShowModal({ ...showModal, endGameModal: false });
    }, 100);
  };

  const logUserIn = () => {
    if (!loggedIn) {
      firebase
        .auth()
        .signInAnonymously()
        .catch(() => {
          return alert(errorMessage);
        });
    }
  };

  const endOfGame = resultText => {
    doShowModal({ ...showModal, endGameModal: true });
    setResult(resultText);
  };

  const afterWinActions = (warWin = false) => {
    setTimeout(() => {
      setCardDrawn({ user: "", cpu: "" });
      doStartAnimation({ userWon: false, cpuWon: false });
      setDrawDisabled(false);
      focusOnButton();
      warWin && setWarCardArrays({ user: [], cpu: [] });
    }, 310);
  };

  const onGameStartTwo = () => {
    logUserIn();
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

        /* create two 26 card piles for deck  */

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

      //add to deck

      setTimeout(() => {
        if (cardValue(userCards.value) === cardValue(cpuCards.value)) {
          //firstwar
          if (userCardsRemaining < 2) {
            return endOfGame("lose");
          } else if (cpuCardsRemaining < 2) {
            return endOfGame("win");
          }
          showWarModal();
          const warDraw = () => {
            setTimeout(async () => {
              try {
                let drawTwo = "draw/?count=2";
                const [userWarDraw, cpuWarDraw] = await Promise.all([
                  axios.get(`${apiStart}/${id}/pile/${user_pile}/${drawTwo}`),
                  axios.get(`${apiStart}/${id}/pile/${cpu_pile}/${drawTwo}`)
                ]);

                let warAgainUserRemaining =
                  userWarDraw.data.piles.user_pile.remaining;
                let warAgainCpuRemaining =
                  cpuWarDraw.data.piles.cpu_pile.remaining;
                let userFirstCard = userWarDraw.data.cards[0];
                let userSecondCard = userWarDraw.data.cards[1];
                let cpuFirstCard = cpuWarDraw.data.cards[0];
                let cpuSecondCard = cpuWarDraw.data.cards[1];

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
                    if (warAgainUserRemaining < 2) {
                      return endOfGame("lose");
                    } else if (warAgainCpuRemaining < 2) {
                      return endOfGame("win");
                    }
                    showWarModal();
                    warDraw();
                  } else if (
                    cardValue(userSecondCard.value) >
                    cardValue(cpuSecondCard.value)
                  ) {
                    //send cards to user

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
                            cpu: cpuWarDraw.data.piles.cpu_pile.remaining
                          });
                          doStartAnimation({ userWon: true, cpuWon: false });
                          userDoc.delete().catch(() => alert(errorMessage));
                          afterWinActions(true);
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
                    //send cards to cpu

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
                            user: userWarDraw.data.piles.user_pile.remaining
                          });
                          doStartAnimation({ userWon: false, cpuWon: true });
                          userDoc.delete().catch(() => alert(errorMessage));
                          afterWinActions(true);
                        }, 2000);
                      } catch (err) {
                        alert(err);
                      }
                    };
                    setTimeout(() => {
                      cpuWin();
                    }, 1000);
                  }
                }, 2000);
              } catch (err) {
                alert(err);
              }
            }, 1000);
          };

          warDraw();
        } else if (cardValue(userCards.value) > cardValue(cpuCards.value)) {
          //user card greater
          (async () => {
            try {
              const res = await axios.get(
                `${apiStart}/${id}/pile/${user_pile}/add/?cards=${bothCardCodes}`
              );
              doStartAnimation({ userWon: true, cpuWon: false });
              setCardsLeft({
                user: res.data.piles.user_pile.remaining,
                cpu: cpuCardsRemaining
              });

              afterWinActions();
              setTimeout(() => {
                if (cpuCardsRemaining < 1) return endOfGame("win");
              }, 320);
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
              doStartAnimation({ userWon: false, cpuWon: true });
              setCardsLeft({
                user: userCardsRemaining,
                cpu: res.data.piles.cpu_pile.remaining
              });
              afterWinActions();
              setTimeout(() => {
                if (userCardsRemaining < 1) return endOfGame("lose");
              }, 320);
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
  const showGameVals = () => loggedIn && cardsLeft.user && cardsLeft.cpu;
  const decksSet = () => !!cardsLeft.user || !!cardsLeft.cpu;
  return (
    <>
      <GlobalStyle />

      {decksSet() || <Instructions onStart={onGameStartTwo} />}
      {showGameVals() && (
        <>
          <p>Deck: {cardsLeft.cpu}</p>
          <h2>CPU</h2>
          <DrawnCard
            showCard={cardDrawn.cpu}
            src={cardDrawn.cpu.image}
            alt={`${cardDrawn.cpu.value} of ${cardDrawn.cpu.suit}`}
            cpuWonAnimation={startAnimation.cpuWon}
            userWonAnimation={startAnimation.userWon}
          />
          <AllWarCards
            startAnimation={startAnimation}
            warCardArrays={warCardArrays}
          />

          <DrawnCard
            showCard={cardDrawn.user}
            src={cardDrawn.user.image}
            alt={`${cardDrawn.user.value} of ${cardDrawn.user.suit}`}
            cpuWonAnimation={startAnimation.cpuWon}
            userWonAnimation={startAnimation.userWon}
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
