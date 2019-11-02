import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { GlobalStyle } from "./GlobalStyles";
import { cardValue } from "./cardValue";
import { splitDeck } from "./splitDeck";
import { DrawnCard } from "./DrawnCard";
import { Modal } from "./Modal";
import { WarCards } from "./WarCards";
import { Button } from "./Button";
import firebase from "./firebaseConfig";
import axios from "axios";

/*
free: company branding, no url changes, no access to analytics, storage limit
paid: remove company branding, unlimited url changes, analytics, storage limit increased
*/

function App() {
  const [id, setID] = useState("");
  const [cardsLeft, setCardsLeft] = useState({ user: "", cpu: "" });
  const [cardDrawn, setCardDrawn] = useState({ user: "", cpu: "" });
  const [warCardArrays, setWarCardArrays] = useState({ user: [], cpu: [] });
  const [userDoc, setUserDoc] = useState("");
  const [loggedIn, isLoggedIn] = useState(null);
  const [gameUnderway, gameIsUnderway] = useState(false);

  const [drawDisabled, setDrawDisabled] = useState(false);
  const [showModal, doShowModal] = useState(false);
  const [startAnimation, doStartAnimation] = useState({
    userWon: false,
    cpuWon: false
  });
  const apiStart = `https://deckofcardsapi.com/api/deck`;

  useEffect(() => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        console.log(user.uid);
        setUserDoc(
          firebase
            .firestore()
            .collection("collection")
            .doc(user.uid)
        );
        isLoggedIn(true);
      } else {
        isLoggedIn(false);
        console.log("not signed in");
      }
    });
  }, []);

  const user_pile = "user_pile";
  const cpu_pile = "cpu_pile";

  const ModalOpenAndClose = () => {
    doShowModal(true);
    setTimeout(() => {
      doShowModal(false);
    }, 900);
  };

  const restartGame = () => {
    userDoc.delete();
    setWarCardArrays({ user: [], cpu: [] });
    setCardDrawn({ user: "", cpu: "" });
    doStartAnimation({
      userWon: false,
      cpuWon: false
    });
  };

  const logUserIn = () => {
    if (!loggedIn) {
      firebase
        .auth()
        .signInAnonymously()
        .catch(() => {
          return alert(
            "There's been an error. Please refresh the page or try again later."
          );
        });
    }
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
          //   console.log(res.data);
          // let pilesData = res.data.piles;
          gameIsUnderway(true);

          setCardsLeft({
            user: user_deck.data.piles.user_pile.remaining,
            cpu: cpu_deck.data.piles.cpu_pile.remaining
          });
          setDrawDisabled(false);
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
    setDrawDisabled(true);
    try {
      const [userDraw, cpuDraw] = await Promise.all([
        axios.get(`${apiStart}/${id}/pile/${user_pile}/draw/bottom/?count=1`),
        axios.get(`${apiStart}/${id}/pile/${cpu_pile}/draw/bottom/?count=1`)
      ]);

      setTimeout(() => {
        doStartAnimation({ userWon: false, cpuWon: false });
      }, 300);

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
            return alert("You lost!");
          } else if (cpuCardsRemaining < 2) {
            return alert("You win!");
          }

          ModalOpenAndClose();
          const warDraw = () => {
            setTimeout(async () => {
              try {
                const [userWarDraw, cpuWarDraw] = await Promise.all([
                  axios.get(
                    `${apiStart}/${id}/pile/${user_pile}/draw/?count=2`
                  ),
                  axios.get(`${apiStart}/${id}/pile/${cpu_pile}/draw/?count=2`)
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
                console.log(cpuWarCards, userWarCards);
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
                      return alert("You Lost");
                    } else if (warAgainCpuRemaining < 2) {
                      return alert("You Won");
                    }

                    ModalOpenAndClose();
                    warDraw();
                  } else if (
                    cardValue(userSecondCard.value) >
                    cardValue(cpuSecondCard.value)
                  ) {
                    //send cards to user
                    console.log("user wins war");

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
                          userDoc.delete().then(() => console.log("deleted"));
                          setTimeout(() => {
                            setDrawDisabled(false);
                            setWarCardArrays({ user: [], cpu: [] });
                          }, 310);
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
                    console.log("cpu wins war");
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

                          userDoc.delete().then(() => console.log("deleted"));
                          setTimeout(() => {
                            setDrawDisabled(false);
                            setWarCardArrays({ user: [], cpu: [] });
                          }, 310);
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
            }, 800);
          };

          warDraw();
        } else if (cardValue(userCards.value) > cardValue(cpuCards.value)) {
          console.log("user card greater");
          (async () => {
            try {
              const res = await axios.get(
                `${apiStart}/${id}/pile/${user_pile}/add/?cards=${bothCardCodes}`
              );
              doStartAnimation({ userWon: true, cpuWon: false });
              setCardsLeft({
                user: res.data.piles.user_pile.remaining,
                cpu: cpuDraw.data.piles.cpu_pile.remaining
              });

              setTimeout(() => {
                console.log("inline cleanup");
                setDrawDisabled(false);
              }, 310);
              if (cpuDraw.data.piles.cpu_pile.remaining < 1)
                return alert("You Win!");
            } catch (err) {
              alert(err);
            }
          })();
        } else if (cardValue(userCards.value) < cardValue(cpuCards.value)) {
          console.log("cpu card greater");
          (async () => {
            try {
              const res = await axios.get(
                `${apiStart}/${id}/pile/${cpu_pile}/add/?cards=${bothCardCodes}`
              );
              doStartAnimation({ userWon: false, cpuWon: true });
              setCardsLeft({
                user: userDraw.data.piles.user_pile.remaining,
                cpu: res.data.piles.cpu_pile.remaining
              });
              setTimeout(() => {
                console.log("inline cleanup");
                setDrawDisabled(false);
              }, 310);
              if (userDraw.data.piles.user_pile.remaining < 1)
                return alert("You Lose!");
            } catch (err) {
              alert(err);
            }
          })();
        }
      }, 1500);
    } catch (err) {
      alert(err);
    }
  };

  const showGameVals = () =>
    gameUnderway && loggedIn && cardsLeft.user !== "" && cardsLeft.cpu !== "";

  const loggedInStatusSet = () =>
    (loggedIn === true || loggedIn === false) && !gameUnderway;

  return (
    <>
      <GlobalStyle />
      <div>
        <Modal startAnimation={showModal} text="WAR" />
        {loggedInStatusSet() && <Button onClick={onGameStartTwo}>Start</Button>}
        {loggedIn === null && <h1>Initializing...</h1>}

        {showGameVals() && (
          <>
            {<p>Deck: {cardsLeft.cpu}</p>}
            <h2>CPU</h2>

            <DrawnCard
              showCard={cardDrawn.cpu}
              src={cardDrawn.cpu.image}
              alt={`${cardDrawn.cpu.value} of ${cardDrawn.cpu.suit}`}
              cpuWonAnimation={startAnimation.cpuWon}
              userWonAnimation={startAnimation.userWon}
            />
            <br />
            <WarCards
              array={warCardArrays.cpu}
              cpuWonAnimation={startAnimation.cpuWon}
              userWonAnimation={startAnimation.userWon}
            />
            <br />
            <br />
            <br />
            <WarCards
              array={warCardArrays.user}
              cpuWonAnimation={startAnimation.cpuWon}
              userWonAnimation={startAnimation.userWon}
            />
            <br />
            <DrawnCard
              showCard={cardDrawn.user}
              src={cardDrawn.user.image}
              alt={`${cardDrawn.user.value} of ${cardDrawn.user.suit}`}
              cpuWonAnimation={startAnimation.cpuWon}
              userWonAnimation={startAnimation.userWon}
            />

            <h2>You</h2>
            {<p>Deck: {cardsLeft.user}</p>}

            <Button disabled={drawDisabled} onClick={onDrawTwo}>
              Draw
            </Button>
          </>
        )}
      </div>
    </>
  );
}

export default App;
